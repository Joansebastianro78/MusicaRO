/**
 * Mirrors api/_lib/track.ts. Kept as a separate copy so the client and
 * api packages can be versioned independently; if you later move this
 * into a shared workspace package, both sides can import from there
 * instead.
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  /** Which catalog this track came from. */
  source: 'audius' | 'jamendo' | 'fallback';
  /** Beats per minute, when known. */
  bpm?: number;
  /** Human readable duration, e.g. "2:26". */
  duration?: string;
  /** Link to the track's page (artist profile, licensing info, etc). */
  sourceUrl?: string;
  /** License URL/name, when the provider reports one (Jamendo tracks). */
  license?: string;
}
