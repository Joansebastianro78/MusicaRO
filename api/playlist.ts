import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Track } from './_lib/track';
import { fetchAudiusTracks } from './_lib/audius';
import { fetchJamendoTracks, JamendoConfigError } from './_lib/jamendo';
import { fallbackPlaylist } from './_lib/fallbackPlaylist';

/** Interleaves two lists (a0, b0, a1, b1, ...) instead of concatenating
 *  them, so the playlist alternates between catalogs rather than
 *  playing one entire source before the other. */
function interleave(a: Track[], b: Track[]): Track[] {
  const out: Track[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

const MAX_TRACKS = 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Same-origin in production (client + api are one Vercel project), but
  // this keeps the endpoint usable if the frontend is ever hosted
  // separately — it's read-only, public data.
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const search = typeof req.query.s === 'string' ? req.query.s : undefined;
  const genre = typeof req.query.genre === 'string' ? req.query.genre : undefined;
  const source = typeof req.query.source === 'string' ? req.query.source : 'all';
  // Default to the max (100) — the whole point of combining two catalogs
  // is having a big playlist. Anything requested above 100 gets clamped.
  const requestedLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : NaN;
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), MAX_TRACKS)
      : MAX_TRACKS;

  const wantAudius = source === 'all' || source === 'audius';
  const wantJamendo = source === 'all' || source === 'jamendo';
  // When mixing both sources, ask each for half so the combined list
  // still respects the requested total.
  const perSourceLimit = source === 'all' ? Math.ceil(limit / 2) : limit;

  const [audiusResult, jamendoResult] = await Promise.allSettled([
    wantAudius ? fetchAudiusTracks({ search, limit: perSourceLimit, genre }) : Promise.resolve<Track[]>([]),
    wantJamendo ? fetchJamendoTracks({ search, limit: perSourceLimit }) : Promise.resolve<Track[]>([])
  ]);

  const audiusTracks = audiusResult.status === 'fulfilled' ? audiusResult.value : [];
  const jamendoTracks = jamendoResult.status === 'fulfilled' ? jamendoResult.value : [];

  if (audiusResult.status === 'rejected') {
    console.error('[api/playlist] Audius request failed:', audiusResult.reason);
  }
  if (jamendoResult.status === 'rejected') {
    if (jamendoResult.reason instanceof JamendoConfigError) {
      console.warn(
        '[api/playlist] JAMENDO_CLIENT_ID is not set — skipping Jamendo, serving Audius only. ' +
          'Get a free client_id at https://devportal.jamendo.com to include Jamendo tracks.'
      );
    } else {
      console.error('[api/playlist] Jamendo request failed:', jamendoResult.reason);
    }
  }

  const combined = interleave(audiusTracks, jamendoTracks).slice(0, limit);

  if (combined.length === 0) {
    // Neither provider returned anything (both down/misconfigured) —
    // degrade to the bundled demo playlist so the UI stays functional.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(fallbackPlaylist);
    return;
  }

  // Cache at the CDN edge for 30 minutes, and allow serving a stale copy
  // for up to a day while revalidating in the background — avoids
  // hitting Audius/Jamendo on every page load.
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
  res.status(200).json(combined);
}
