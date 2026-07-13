import { Track } from './track';
import { formatDuration } from './format';

const AUDIUS_BASE = 'https://api.audius.co/v1';

/**
 * Audius (https://docs.audius.co/api) is a fully public, decentralized
 * music catalog. Reads work with zero authentication — no key, no
 * signup. An API key is optional and only raises your rate limits;
 * see AUDIUS_API_KEY in .env.example.
 */
interface AudiusArtwork {
  '150x150'?: string;
  '480x480'?: string;
  '1000x1000'?: string;
}

interface AudiusUser {
  name?: string;
  handle?: string;
}

interface AudiusStream {
  /** Ready-to-play, signed streaming URL for this track. */
  url?: string;
}

interface AudiusTrack {
  id: string;
  title: string;
  duration?: number;
  genre?: string;
  permalink?: string;
  artwork?: AudiusArtwork;
  user?: AudiusUser;
  stream?: AudiusStream;
}

interface AudiusListResponse {
  data: AudiusTrack[];
}

function pickArtwork(artwork?: AudiusArtwork): string {
  return artwork?.['480x480'] ?? artwork?.['1000x1000'] ?? artwork?.['150x150'] ?? '';
}

function mapTrack(track: AudiusTrack): Track {
  return {
    id: `audius-${track.id}`,
    title: track.title,
    artist: track.user?.name || track.user?.handle || 'Audius Artist',
    // Audius already includes a signed, ready-to-stream CDN url on every
    // track object — no extra request needed to resolve it.
    audioUrl: track.stream?.url ?? `${AUDIUS_BASE}/tracks/${track.id}/stream?app_name=ImmersiveMusicApp`,
    coverUrl: pickArtwork(track.artwork),
    source: 'audius',
    duration: formatDuration(track.duration),
    sourceUrl: track.permalink ? `https://audius.co${track.permalink}` : undefined
  };
}

export interface FetchAudiusOptions {
  /** Free-text search query. Falls back to the trending chart when omitted. */
  search?: string;
  /** Max number of tracks to return. */
  limit?: number;
  /** Filter trending by genre (only applies when there's no search query). */
  genre?: string;
}

export async function fetchAudiusTracks(options: FetchAudiusOptions = {}): Promise<Track[]> {
  const { search, limit = 8, genre } = options;

  const url = new URL(search ? `${AUDIUS_BASE}/tracks/search` : `${AUDIUS_BASE}/tracks/trending`);
  url.searchParams.set('app_name', 'ImmersiveMusicApp');
  url.searchParams.set('limit', String(limit));
  if (search) {
    url.searchParams.set('query', search);
  } else if (genre) {
    url.searchParams.set('genre', genre);
  }
  // Optional: raises rate limits, never required. See docs.audius.co/api.
  if (process.env.AUDIUS_API_KEY) {
    url.searchParams.set('api_key', process.env.AUDIUS_API_KEY);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Audius API responded with ${res.status}`);
  }

  const data = (await res.json()) as AudiusListResponse;
  return (data.data ?? []).filter((t) => Boolean(t.stream?.url) || Boolean(t.id)).map(mapTrack);
}
