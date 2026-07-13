import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  getFrequencyData: () => Uint8Array | null;
  isPlaying: boolean;
}

interface Particle {
  x: number;
  y: number;
  baseRadius: number;
  angle: number;
  orbitSpeed: number;
  hue: number;
}

const average = (data: Uint8Array, start: number, end: number): number => {
  let sum = 0;
  for (let i = start; i < end; i++) sum += data[i];
  return sum / (end - start);
};

/**
 * Renders an ambient particle field on a full-screen canvas. Two bands
 * are read from the AnalyserNode each frame: bass (low bins) drives the
 * central "vinyl label" glow and particle size; mids drive a subtler
 * shimmer. Runs its own requestAnimationFrame loop so it stays in sync
 * with the AnalyserNode regardless of React's render cycle.
 */
export default function AudioVisualizer({ getFrequencyData, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 90;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      baseRadius: Math.random() * 1.6 + 0.8,
      angle: Math.random() * Math.PI * 2,
      orbitSpeed: Math.random() * 0.35 + 0.08,
      hue: 30 + Math.random() * 22 // warm gold/amber range
    }));

    const draw = () => {
      const { width, height } = canvas;

      // Ink-colored trail instead of a hard clear — gives particles a soft tail
      ctx.fillStyle = 'rgba(11, 11, 15, 0.28)';
      ctx.fillRect(0, 0, width, height);

      const freq = getFrequencyData();
      const bass = freq ? average(freq, 0, 16) / 255 : 0;
      const mid = freq ? average(freq, 16, 64) / 255 : 0;

      // Central "vinyl label" glow, pulses with bass
      const cx = width / 2;
      const cy = height / 2;
      const glowRadius = 110 + bass * 240;
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      centerGlow.addColorStop(0, `hsla(350, 50%, 32%, ${0.22 + bass * 0.35})`);
      centerGlow.addColorStop(1, 'hsla(350, 50%, 32%, 0)');
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      particlesRef.current.forEach((p) => {
        p.angle += p.orbitSpeed * 0.02;
        p.x += Math.cos(p.angle) * (0.25 + bass * 1.8);
        p.y += Math.sin(p.angle) * (0.25 + bass * 1.8);

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const radius = p.baseRadius + bass * 6 + mid * 2.5;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
        glow.addColorStop(0, `hsla(${p.hue}, 75%, 62%, ${0.45 + bass * 0.4})`);
        glow.addColorStop(1, 'hsla(0, 0%, 0%, 0)');

        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [getFrequencyData]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 transition-opacity duration-700 ${
        isPlaying ? 'opacity-100' : 'opacity-35'
      }`}
    />
  );
}
