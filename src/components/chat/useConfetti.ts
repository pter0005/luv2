'use client';

import { useCallback, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  life: number;
};

const COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e'];

/**
 * Canvas-based confetti without external deps. Renders on a single canvas
 * that's lazily mounted to document.body on first fire and reused.
 */
export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  const ensureCanvas = useCallback(() => {
    if (canvasRef.current) return canvasRef.current;
    const c = document.createElement('canvas');
    c.style.position = 'fixed';
    c.style.inset = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.pointerEvents = 'none';
    c.style.zIndex = '9999';
    const dpr = window.devicePixelRatio || 1;
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    const ctx = c.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    document.body.appendChild(c);
    canvasRef.current = c;

    const onResize = () => {
      const d = window.devicePixelRatio || 1;
      c.width = window.innerWidth * d;
      c.height = window.innerHeight * d;
      const cctx = c.getContext('2d');
      if (cctx) cctx.scale(d, d);
    };
    window.addEventListener('resize', onResize);
    return c;
  }, []);

  const tick = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);

    const g = 0.18;
    const drag = 0.995;

    particlesRef.current.forEach((p) => {
      p.vy += g;
      p.vx *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 60));
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
      ctx.restore();
    });

    particlesRef.current = particlesRef.current.filter(
      (p) => p.life > 0 && p.y < window.innerHeight + 20
    );

    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, []);

  const fire = useCallback(
    (count = 80, origin: { x?: number; y?: number } = {}) => {
      if (typeof window === 'undefined') return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

      ensureCanvas();
      const ox = origin.x ?? window.innerWidth / 2;
      const oy = origin.y ?? window.innerHeight / 2.4;

      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
        const speed = 6 + Math.random() * 6;
        particlesRef.current.push({
          x: ox + (Math.random() - 0.5) * 60,
          y: oy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.4,
          size: 6 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          life: 110 + Math.random() * 40,
        });
      }

      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [ensureCanvas, tick]
  );

  return fire;
}
