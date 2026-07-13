/**
 * Shape of a single track returned by GET /api/playlist.
 * This interface is intentionally mirrored on the client
 * (client/src/types/track.ts) so both sides share a contract.
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
}
