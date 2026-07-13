import { motion, AnimatePresence } from 'framer-motion';

interface StartOverlayProps {
  visible: boolean;
  onStart: () => void;
  errorMessage?: string | null;
}

/**
 * Browsers block audio.play() and AudioContext creation until a real
 * user gesture happens. This overlay exists purely to capture that
 * gesture — its onClick is where connectSource/resumeContext/play()
 * all get called (see MusicPlayer.handleStart).
 */
export default function StartOverlay({ visible, onStart, errorMessage }: StartOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <motion.span
            className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-gold/70"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            Immersive Music Player
          </motion.span>
          <motion.h1
            className="mb-10 font-display text-4xl italic text-cream"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            Step into the sound
          </motion.h1>
          <motion.button
            onClick={onStart}
            className="rounded-full border border-gold/50 px-8 py-3 font-body text-sm tracking-wide text-cream transition hover:bg-gold hover:text-ink"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Drop the needle
          </motion.button>
          {errorMessage && (
            <motion.p
              className="mt-6 max-w-xs text-center font-mono text-xs text-wine"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {errorMessage}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
