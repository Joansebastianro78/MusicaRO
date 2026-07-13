import { Track } from './track';
import { formatDuration } from './format';

const JAMENDO_BASE = 'https://api.jamendo.com/v3.0/tracks/';

/**
 * Jamendo (https://developer.jamendo.com/v3.0/docs) is a free/Creative
 * Commons music catalog. Read endpoints need a `client_id`, obtained
 * for free at https://devportal.jamendo.com — no OAuth/secret required
 * for search & playback.
 */
interface JamendoTrack {
  id: string;
  name: string;
  duration?: number;
  artist_name: string;
  album_image?: string;
  image?: string;
  /** Streaming URL (mp3 by default; we request mp32 = good quality VBR). */
  audio: string;
  shareurl?: string;
  license_ccurl?: string;
}

interface JamendoListResponse {
  results: JamendoTrack[];
}

export class JamendoConfigError extends Error {}

function mapTrack(track: JamendoTrack): Track {
  return {
    id: `jamendo-${track.id}`,
    title: track.name,
    artist: track.artist_name,
    audioUrl: track.audio,
    coverUrl: track.album_image || track.image || '',
    source: 'jamendo',
    duration: formatDuration(track.duration),
    sourceUrl: track.shareurl,
    license: track.license_ccurl
  };
}

export interface FetchJamendoOptions {
  /** Free-text search (Jamendo's `search` param — matches track/album/artist/tags). */
  search?: string;
  /** Max number of tracks to return (Jamendo max is 200). */
  limit?: number;
}

export async function fetchJamendoTracks(options: FetchJamendoOptions = {}): Promise<Track[]> {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    throw new JamendoConfigError('JAMENDO_CLIENT_ID is not set.');
  }

  const url = new URL(JAMENDO_BASE);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(options.limit ?? 8));
  url.searchParams.set('audioformat', 'mp32');
  url.searchParams.set('imagesize', '500');
  if (options.search) {
    url.searchParams.set('search', options.search);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Jamendo API responded with ${res.status}`);
  }

  const data = (await res.json()) as JamendoListResponse;
  return (data.results ?? []).filter((t) => Boolean(t.audio)).map(mapTrack);
}
