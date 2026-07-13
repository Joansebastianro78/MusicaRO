import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StartOverlay from './StartOverlay';
import AudioVisualizer from './AudioVisualizer';
import { useAudioAnalyser } from '../hooks/useAudioAnalyser';
import { Track } from '../types/track';

// In production on Vercel, the client and the /api functions are served
// from the same domain, so a relative path just works. VITE_API_URL is
// only needed for edge cases (e.g. pointing a locally-run client at a
// separately deployed API).
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Web Audio / DOM handles live in refs — they're mutable engine
  // objects, not render-driving state.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { connectSource, resumeContext, getFrequencyData } = useAudioAnalyser();

  // Fetch the playlist from the Express backend on mount.
  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/api/playlist`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json() as Promise<Track[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setTracks(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentTrack = tracks[currentIndex];

  // Required user gesture: wires the AnalyserNode, resumes the
  // AudioContext, and starts playback — all inside one click handler.
  const handleStart = useCallback(async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    setPlaybackError(null);
    connectSource(audioEl);
    await resumeContext();

    try {
      await audioEl.play();
      setIsPlaying(true);
      setHasStarted(true);
    } catch (err) {
      console.error('Playback failed to start:', err);
      setPlaybackError(
        'No se pudo reproducir el audio. Puede ser un problema temporal de Audius/Jamendo o de CORS en el archivo — probá con otro track (⏭).'
      );
    }
  }, [connectSource, resumeContext]);

  const togglePlay = useCallback(async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (isPlaying) {
      audioEl.pause();
      setIsPlaying(false);
    } else {
      await resumeContext();
      await audioEl.play();
      setIsPlaying(true);
    }
  }, [isPlaying, resumeContext]);

  const changeTrack = useCallback(
    (direction: 1 | -1) => {
      if (tracks.length === 0) return;
      setCurrentIndex((prev) => (prev + direction + tracks.length) % tracks.length);
      setIsPlaying(true);
    },
    [tracks.length]
  );

  // Whenever the current track changes (and playback has already been
  // unlocked by the overlay), load the new source and resume playing.
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !currentTrack || !hasStarted) return;

    audioEl.load();
    if (isPlaying) {
      audioEl.play().catch((err) => console.error('Playback failed:', err));
    }
    // Only re-run when the track itself changes, not on every isPlaying toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, hasStarted]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink font-mono text-sm text-cream/50">
        Loading playlist…
      </div>
    );
  }

  if (error || !currentTrack) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink px-6 text-center font-mono text-sm text-wine">
        {error ?? 'No tracks available.'} Make sure the /api/playlist function is reachable
        {API_BASE ? ` at ${API_BASE}` : ''}.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-cream">
      <AudioVisualizer getFrequencyData={getFrequencyData} isPlaying={isPlaying} />

      <StartOverlay visible={!hasStarted} onStart={handleStart} errorMessage={playbackError} />

      {/* Single persistent <audio> element — src swaps per track, the
          Web Audio graph stays connected across those swaps. */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        crossOrigin="anonymous"
        onEnded={() => changeTrack(1)}
      />

      {hasStarted && (
        <motion.div
          className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTrack.id}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.97 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="flex flex-col items-center text-center"
            >
              {/* Vinyl disc: spins continuously while playing (CSS),
                  tonearm lifts/drops with isPlaying (Framer Motion). */}
              <div className="relative mb-10 h-64 w-64">
                <div
                  className="h-64 w-64 overflow-hidden rounded-full shadow-vinyl ring-4 ring-surface"
                  style={{
                    animation: 'spin-slow 9s linear infinite',
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                >
                  <img
                    src={currentTrack.coverUrl}
                    alt={`${currentTrack.title} cover art`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_18px_rgba(11,11,15,0.55)]" />
                </div>
                <motion.div
                  className="absolute -right-3 -top-3 h-20 w-1.5 origin-top-right rounded-full bg-gold"
                  animate={{ rotate: isPlaying ? 8 : -30 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              <h2 className="font-display text-2xl italic text-cream">{currentTrack.title}</h2>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.25em] text-gold/70">
                {currentTrack.artist}
              </p>
              {currentTrack.source !== 'fallback' && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cream/30">
                  via {currentTrack.source === 'audius' ? 'Audius' : 'Jamendo'}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center gap-8">
            <button
              onClick={() => changeTrack(-1)}
              className="font-mono text-lg text-cream/50 transition hover:text-cream"
              aria-label="Previous track"
            >
              ⏮
            </button>
            <button
              onClick={togglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-ink transition hover:scale-105"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <span className="text-xl">{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <button
              onClick={() => changeTrack(1)}
              className="font-mono text-lg text-cream/50 transition hover:text-cream"
              aria-label="Next track"
            >
              ⏭
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
