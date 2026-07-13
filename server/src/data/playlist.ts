import { Track } from '../types/track';

/**
 * Sample playlist. These mp3s come from Mozilla's official Web Audio API
 * examples repo (mdn/webaudio-examples), served via raw.githubusercontent.com,
 * which reliably sends `Access-Control-Allow-Origin: *` — verified with
 * curl -I before wiring them in. This matters because the <audio> element
 * uses crossOrigin="anonymous": without a proper CORS header the browser
 * silently refuses to load the file and play() rejects.
 * Swap these for your own catalog once you have real audio hosting.
 */
export const playlist: Track[] = [
  {
    id: '1',
    title: 'Drums',
    artist: 'MDN Web Audio Examples',
    audioUrl: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/multi-track/drums.mp3',
    coverUrl: 'https://picsum.photos/seed/midnight-drift/600/600'
  },
  {
    id: '2',
    title: 'Bass Guitar',
    artist: 'MDN Web Audio Examples',
    audioUrl: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/multi-track/bassguitar.mp3',
    coverUrl: 'https://picsum.photos/seed/neon-pulse/600/600'
  },
  {
    id: '3',
    title: 'Lead Guitar',
    artist: 'MDN Web Audio Examples',
    audioUrl: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/multi-track/leadguitar.mp3',
    coverUrl: 'https://picsum.photos/seed/glass-horizon/600/600'
  }
];


