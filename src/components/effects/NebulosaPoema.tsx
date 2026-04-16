'use client';

import React, { useEffect, useRef } from 'react';

interface Orb { x: number; y: number; r: number; hue: number; sat: number; lit: number; vx: number; vy: number; phase: number; }
interface Star { x: number; y: number; r: number; phase: number; speed: number; }

const W = 375;
const H = 812;
const ORB_COUNT = 9;
const STAR_COUNT = 75;

export default function NebulosaPoema() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    orbs: Orb[];
    stars: Star[];
    bgCanvas: HTMLCanvasElement | null;
    bgCtx: CanvasRenderingContext2D | null;
    bgLastRender: number;
    grainCanvas: HTMLCanvasElement | null;
    grainPattern: CanvasPattern | null;
    grainTick: number;
    rafId: number;
    ctx: CanvasRenderingContext2D | null;
  }>({
    orbs: [], stars: [],
    bgCanvas: null, bgCtx: null, bgLastRender: -9999,
    grainCanvas: null, grainPattern: null, grainTick: 0,
    rafId: 0, ctx: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;

    // setup main canvas
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    s.ctx = canvas.getContext('2d');
    if (!s.ctx) return;
    s.ctx.setTransform(dpr * (canvas.offsetWidth / W), 0, 0, dpr * (canvas.offsetHeight / H), 0, 0);

    // init orbs
    s.orbs = [];
    for (let i = 0; i < ORB_COUNT; i++) {
      s.orbs.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 80 + Math.random() * 150,
        hue: 270 + Math.random() * 60,
        sat: 70 + Math.random() * 15,
        lit: 24 + Math.random() * 12,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // init stars
    s.stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      s.stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.4 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.6,
      });
    }

    // offscreen bg canvas (rendered at 15Hz)
    s.bgCanvas = document.createElement('canvas');
    s.bgCanvas.width = W;
    s.bgCanvas.height = H;
    s.bgCtx = s.bgCanvas.getContext('2d');

    // grain canvas
    s.grainCanvas = document.createElement('canvas');
    s.grainCanvas.width = 160;
    s.grainCanvas.height = 160;
    const gctx = s.grainCanvas.getContext('2d')!;
    const id = gctx.createImageData(160, 160);
    for (let i = 0; i < id.data.length; i += 4) {
      const n = ((Math.random() + Math.random()) * 128) | 0;
      id.data[i] = n; id.data[i + 1] = n; id.data[i + 2] = n; id.data[i + 3] = 255;
    }
    gctx.putImageData(id, 0, 0);
    s.grainPattern = s.ctx.createPattern(s.grainCanvas, 'repeat');

    let lastTime = performance.now();

    const renderBg = () => {
      const c = s.bgCtx!;
      c.fillStyle = '#0a0510';
      c.fillRect(0, 0, W, H);
      for (const o of s.orbs) {
        const breathe = 1 + Math.sin(o.phase) * 0.05;
        const r = o.r * breathe;
        const g = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
        g.addColorStop(0, `hsla(${o.hue},${o.sat}%,${o.lit}%,.55)`);
        g.addColorStop(0.55, `hsla(${o.hue},${o.sat}%,${o.lit * .7}%,.22)`);
        g.addColorStop(1, `hsla(${o.hue},${o.sat}%,${o.lit * .5}%,0)`);
        c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y, r, 0, Math.PI * 2); c.fill();
      }
      for (const star of s.stars) {
        const al = 0.3 + 0.7 * (Math.sin(star.phase) * 0.5 + 0.5);
        c.globalAlpha = al * 0.8;
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(star.x, star.y, star.r, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
      const vg = c.createRadialGradient(W / 2, H * 0.52, H * 0.25, W / 2, H * 0.52, H * 0.78);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.65)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    };

    const loop = (now: number) => {
      s.rafId = requestAnimationFrame(loop);
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      // update orbs
      for (const o of s.orbs) {
        o.x += o.vx * dt * 0.05; o.y += o.vy * dt * 0.05; o.phase += dt * 0.0003;
        if (o.x < -o.r) o.vx = Math.abs(o.vx);
        if (o.x > W + o.r) o.vx = -Math.abs(o.vx);
        if (o.y < -o.r) o.vy = Math.abs(o.vy);
        if (o.y > H + o.r) o.vy = -Math.abs(o.vy);
      }
      // update stars
      for (const star of s.stars) star.phase += dt * 0.001 * star.speed;

      const ctx = s.ctx!;

      // render bg at 15Hz
      if (now - s.bgLastRender >= 66) { renderBg(); s.bgLastRender = now; }
      if (s.bgCanvas) ctx.drawImage(s.bgCanvas, 0, 0, W, H);

      // grain overlay
      s.grainTick = (s.grainTick + 1) % 3;
      if (s.grainTick === 0 && s.grainPattern) {
        const ox = (now * 0.05) % 160 | 0;
        const oy = (now * 0.041) % 160 | 0;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.globalAlpha = 0.065;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = s.grainPattern;
        ctx.fillRect(-ox - 4, -oy - 4, W + 8, H + 8);
        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    };

    s.rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(s.rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
