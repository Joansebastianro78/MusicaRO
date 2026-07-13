import { Track } from './track';

const HOOKSOUNDS_ENDPOINT = 'https://www.hooksounds.com/edd-api/products/';

/**
 * Shape of a single "product" (track) as returned by HookSounds'
 * edd-api/products endpoint. Only the fields we actually use are
 * declared — the real payload has more (pricing, licensing, etc).
 * Docs: https://docs.hooksounds.com/asset/track/
 */
interface HookSoundsCategory {
  name: string;
}

interface HookSoundsTrackInfo {
  id: number;
  title: string;
  thumbnail: string;
  mp3: string;
  bpm?: number;
  duration?: string;
  link?: string;
  category?: HookSoundsCategory[];
}

interface HookSoundsProduct {
  info: HookSoundsTrackInfo;
}

interface HookSoundsResponse {
  products: HookSoundsProduct[];
}

export class HookSoundsConfigError extends Error {}

function mapTrack(product: HookSoundsProduct): Track {
  const { info } = product;
  return {
    id: String(info.id),
    title: info.title,
    // HookSounds' catalog is all in-house/original music — there's no
    // per-track "artist" field, so we surface the category as a stand-in
    // (e.g. "Originals", "Corporate", "Cinematic").
    artist: info.category?.[0]?.name ?? 'HookSounds',
    audioUrl: info.mp3,
    coverUrl: info.thumbnail,
    bpm: info.bpm,
    duration: info.duration,
    sourceUrl: info.link
  };
}

export interface FetchTracksOptions {
  /** Free-text search query (HookSounds `s` param). */
  search?: string;
  /** Max number of tracks to return (HookSounds `number` param). */
  limit?: number;
}

/**
 * Fetches tracks from the HookSounds REST API and maps them to our
 * internal Track shape. Requires HOOKSOUNDS_API_KEY and
 * HOOKSOUNDS_API_TOKEN to be set as environment variables — these are
 * secrets, so this function must only ever run server-side (inside
 * /api), never in client code.
 */
export async function fetchHookSoundsTracks(options: FetchTracksOptions = {}): Promise<Track[]> {
  const apiKey = process.env.HOOKSOUNDS_API_KEY;
  const apiToken = process.env.HOOKSOUNDS_API_TOKEN;

  if (!apiKey || !apiToken) {
    throw new HookSoundsConfigError(
      'HOOKSOUNDS_API_KEY / HOOKSOUNDS_API_TOKEN are not set.'
    );
  }

  const url = new URL(HOOKSOUNDS_ENDPOINT);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('token', apiToken);
  url.searchParams.set('number', String(options.limit ?? 12));
  if (options.search) {
    url.searchParams.set('s', options.search);
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`HookSounds API responded with ${res.status}`);
  }

  const data = (await res.json()) as HookSoundsResponse;
  const products = data.products ?? [];

  return products
    .filter((p) => Boolean(p.info?.mp3))
    .map(mapTrack);
}
