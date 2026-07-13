import { Track } from './track';

/**
 * Used only when HOOKSOUNDS_API_KEY / HOOKSOUNDS_API_TOKEN aren't
 * configured yet, or when the HookSounds request fails. This keeps the
 * app usable out of the box (e.g. right after `vercel dev`) instead of
 * showing a blank/broken player while credentials are being set up.
 * Source: Mozilla's public webaudio-examples repo (CORS-enabled mp3s).
 */
export const fallbackPlaylist: Track[] = [
  {
    id: 'fallback-1',
    title: 'Drums (demo track)',
    artist: 'MDN Web Audio Examples',
    audioUrl: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/multi-track/drums.mp3',
    coverUrl: 'https://picsum.photos/seed/midnight-drift/600/600'
  },
  {
    id: 'fallback-2',
    title: 'Bass Guitar (demo track)',
    artist: 'MDN Web Audio Examples',
    audioUrl: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/multi-track/bassguitar.mp3',
    coverUrl: 'https://picsum.photos/seed/neon-pulse/600/600'
  },
  {
    id: 'fallback-3',
    title: 'Lead Guitar (demo track)',
    artist: 'MDN Web Audio Examples',
    audioUrl: 'https://raw.githubusercontent.com/mdn/webaudio-examples/main/multi-track/leadguitar.mp3',
    coverUrl: 'https://picsum.photos/seed/glass-horizon/600/600'
  }
];
