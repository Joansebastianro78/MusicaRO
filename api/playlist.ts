import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchHookSoundsTracks, HookSoundsConfigError } from './_lib/hooksounds';
import { fallbackPlaylist } from './_lib/fallbackPlaylist';

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
  const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

  try {
    const tracks = await fetchHookSoundsTracks({ search, limit: limitParam });

    if (tracks.length === 0) {
      throw new Error('HookSounds returned no tracks');
    }

    // Cache at the CDN edge for an hour, and allow serving a stale copy
    // for up to a day while revalidating in the background — avoids
    // hitting HookSounds on every page load.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(tracks);
  } catch (err) {
    if (err instanceof HookSoundsConfigError) {
      console.warn(
        '[api/playlist] HookSounds credentials missing — serving fallback playlist. ' +
          'Set HOOKSOUNDS_API_KEY and HOOKSOUNDS_API_TOKEN to use real HookSounds tracks.'
      );
    } else {
      console.error('[api/playlist] HookSounds request failed, serving fallback playlist:', err);
    }

    // Never hard-fail the endpoint just because HookSounds is
    // unreachable/misconfigured — degrade to the bundled demo playlist
    // so the UI stays functional.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(fallbackPlaylist);
  }
}
