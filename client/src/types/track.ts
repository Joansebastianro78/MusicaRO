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
  /** Beats per minute, when known (HookSounds tracks only). */
  bpm?: number;
  /** Human readable duration, e.g. "2:26" (HookSounds tracks only). */
  duration?: string;
  /** Link to the track's page / licensing info (HookSounds tracks only). */
  sourceUrl?: string;
}
