/**
 * Shape of a single track returned by GET /api/playlist.
 * Mirrored on the client at client/src/types/track.ts.
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  /** Direct URL to an audio file. Must be served with CORS enabled
   *  (Access-Control-Allow-Origin) since the client fetches it into
   *  a Web Audio AnalyserNode using crossOrigin="anonymous". */
  audioUrl: string;
  /** Direct URL to the cover art image. */
  coverUrl: string;
  /** Beats per minute, when known. */
  bpm?: number;
  /** Human readable duration, e.g. "2:26". */
  duration?: string;
  /** Link to the track's page (licensing info, etc). */
  sourceUrl?: string;
}
