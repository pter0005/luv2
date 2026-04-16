'use client';

import React, { useEffect, useRef } from 'react';

interface Orb {
  x: number; y: number; r: number;
  hue: number; sat: number; lit: number;
  vx: number; vy: number; phase: number;
}
interface Star {
  x: number; y: number; r: number;
  phase: number; speed: number;
  twinkleSpeed: number;
}
interface ShootingStar {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
}

export default function NebulosaPoema() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Mobile detection ──────────────────────────────────
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 768;

    // ── Responsive sizing ─────────────────────────────────
    let W = 0, H = 0, dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 3);
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Orbs — fewer on mobile ────────────────────────────
    const orbCount = isMobile ? 7 : 12;
    const orbs: Orb[] = [];
    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random(), y: Math.random(),
        r: 0.15 + Math.random() * 0.25,
        hue: 250 + Math.random() * 80,
        sat: 55 + Math.random() * 30,
        lit: 18 + Math.random() * 18,
        vx: (Math.random() - 0.5) * 0.00008,
        vy: (Math.random() - 0.5) * 0.00008,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // ── Stars — fewer on mobile ───────────────────────────
    const starCount = isMobile ? 60 : 120;
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: 0.3 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        twinkleSpeed: 0.0008 + Math.random() * 0.002,
      });
    }

    // ── Shooting stars ────────────────────────────────────
    const shootingStars: ShootingStar[] = [];
    let nextShoot = 3000 + Math.random() * 5000;
    let shootTimer = 0;

    // ── Grain texture ─────────────────────────────────────
    const grainSize = isMobile ? 128 : 200;
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = grainSize;
    grainCanvas.height = grainSize;
    const gctx = grainCanvas.getContext('2d')!;
    const imgData = gctx.createImageData(grainSize, grainSize);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = ((Math.random() + Math.random()) * 128) | 0;
      imgData.data[i] = n; imgData.data[i + 1] = n; imgData.data[i + 2] = n; imgData.data[i + 3] = 255;
    }
    gctx.putImageData(imgData, 0, 0);
    const grainPattern = ctx.createPattern(grainCanvas, 'repeat');

    // ── Offscreen background — 15Hz mobile, 20Hz desktop ──
    const bgCanvas = document.createElement('canvas');
    let bgW = 0, bgH = 0;
    const bgCtx = bgCanvas.getContext('2d')!;
    let bgLastRender = -9999;
    const bgInterval = isMobile ? 80 : 66; // ms between bg renders

    const renderBg = () => {
      if (bgW !== W || bgH !== H) {
        bgW = W; bgH = H;
        bgCanvas.width = W; bgCanvas.height = H;
      }
      const c = bgCtx;
      c.fillStyle = '#08020f';
      c.fillRect(0, 0, W, H);

      // nebula glow layers
      for (const o of orbs) {
        const breathe = 1 + Math.sin(o.phase) * 0.08;
        const r = o.r * Math.max(W, H) * breathe;
        const px = o.x * W, py = o.y * H;
        const g = c.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `hsla(${o.hue},${o.sat}%,${o.lit}%,.5)`);
        g.addColorStop(0.4, `hsla(${o.hue},${o.sat}%,${o.lit * 0.7}%,.2)`);
        g.addColorStop(1, `hsla(${o.hue},${o.sat}%,${o.lit * 0.4}%,0)`);
        c.fillStyle = g;
        c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
      }

      // soft central glow
      const cg = c.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.5);
      cg.addColorStop(0, 'hsla(280,70%,25%,.18)');
      cg.addColorStop(0.5, 'hsla(300,50%,15%,.06)');
      cg.addColorStop(1, 'transparent');
      c.fillStyle = cg;
      c.fillRect(0, 0, W, H);

      // stars
      for (const s of stars) {
        const al = 0.25 + 0.75 * (Math.sin(s.phase) * 0.5 + 0.5);
        c.globalAlpha = al;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;

      // vignette
      const vg = c.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.2, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = vg;
      c.fillRect(0, 0, W, H);
    };

    // ── Animation loop ────────────────────────────────────
    let lastTime = performance.now();
    let grainTick = 0;
    const grainMod = isMobile ? 4 : 3; // skip more grain frames on mobile

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      // update orbs (normalized coords)
      for (const o of orbs) {
        o.x += o.vx * dt; o.y += o.vy * dt; o.phase += dt * 0.0004;
        if (o.x < -0.2) o.vx = Math.abs(o.vx);
        if (o.x > 1.2) o.vx = -Math.abs(o.vx);
        if (o.y < -0.2) o.vy = Math.abs(o.vy);
        if (o.y > 1.2) o.vy = -Math.abs(o.vy);
      }

      // update stars
      for (const s of stars) s.phase += dt * s.twinkleSpeed;

      // shooting stars
      shootTimer += dt;
      if (shootTimer >= nextShoot) {
        shootTimer = 0;
        nextShoot = 4000 + Math.random() * 8000;
        const angle = -0.4 - Math.random() * 0.6;
        const speed = 0.3 + Math.random() * 0.3;
        shootingStars.push({
          x: Math.random() * W * 0.8,
          y: Math.random() * H * 0.3,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * -speed,
          life: 0, maxLife: 600 + Math.random() * 500,
          size: 1.2 + Math.random() * 1.2,
        });
      }

      // render bg offscreen at throttled rate
      if (now - bgLastRender >= bgInterval) { renderBg(); bgLastRender = now; }
      ctx.drawImage(bgCanvas, 0, 0, W, H);

      // draw shooting stars on main canvas
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life += dt; ss.x += ss.vx * dt; ss.y -= ss.vy * dt;
        const p = ss.life / ss.maxLife;
        if (p >= 1) { shootingStars.splice(i, 1); continue; }
        const alpha = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
        const tailLen = 40 + p * 60;
        const g = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * tailLen, ss.y + ss.vy * tailLen);
        g.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
        g.addColorStop(0.5, `rgba(200,180,255,${alpha * 0.3})`);
        g.addColorStop(1, 'rgba(200,180,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = ss.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * tailLen, ss.y + ss.vy * tailLen);
        ctx.stroke();
      }

      // grain overlay — skipped more on mobile
      grainTick = (grainTick + 1) % grainMod;
      if (grainTick === 0 && grainPattern) {
        const ox = (now * 0.05) % grainSize | 0;
        const oy = (now * 0.04) % grainSize | 0;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.globalAlpha = 0.045;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = grainPattern;
        ctx.fillRect(-ox - 4, -oy - 4, W + 8, H + 8);
        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block', background: '#08020f' }}
    />
  );
}
