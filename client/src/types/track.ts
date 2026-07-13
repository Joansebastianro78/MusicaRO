/**
 * Mirrors server/src/types/track.ts. Kept as a separate copy so the
 * client and server packages can be deployed/versioned independently;
 * if you later move this into a shared workspace package, both sides
 * can import from there instead.
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
}
