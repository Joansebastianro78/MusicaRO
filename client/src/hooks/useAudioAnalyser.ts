import { useCallback, useRef } from 'react';

interface UseAudioAnalyserReturn {
  /** Wires an <audio> element into an AnalyserNode graph. Safe to call
   *  multiple times — a MediaElementSourceNode can only be created once
   *  per element, so subsequent calls are no-ops. */
  connectSource: (audioEl: HTMLAudioElement) => void;
  /** Resumes the AudioContext if the browser started it suspended
   *  (autoplay policy). Must be called from within a user-gesture
   *  handler, e.g. the Start Overlay's onClick. */
  resumeContext: () => Promise<void>;
  /** Reads the current frequency-domain snapshot (0-255 per bin).
   *  Returns null until a source has been connected. */
  getFrequencyData: () => Uint8Array | null;
}

/**
 * Encapsulates the AudioContext / AnalyserNode / MediaElementSourceNode
 * plumbing so components only deal with a small read API. All Web Audio
 * objects live in refs, not state, since they're mutable engine objects
 * that shouldn't trigger re-renders.
 */
export function useAudioAnalyser(): UseAudioAnalyserReturn {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const connectSource = useCallback((audioEl: HTMLAudioElement) => {
    if (sourceRef.current) return;

    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioContextCtor();

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
  }, []);

  const resumeContext = useCallback(async () => {
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }, []);

  const getFrequencyData = useCallback((): Uint8Array | null => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return null;
    // Cast needed because TS's lib.dom types getByteFrequencyData as
    // accepting Uint8Array<ArrayBuffer> specifically; the array we
    // allocate above is functionally identical at runtime.
    analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
    return dataArray;
  }, []);

  return { connectSource, resumeContext, getFrequencyData };
}
