'use client';

import { useState, useEffect, useRef } from 'react';

interface PurpleExplosionProps {
  onComplete?: () => void;
}

export default function PurpleExplosion({ onComplete }: PurpleExplosionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H / 2;
    const diag = Math.sqrt(W * W + H * H);
    const t0 = Date.now();
    const DURATION = 7;

    const rng = (a: number, b: number) => Math.random() * (b - a) + a;

    // Deep purple palette only
    const DEEP = { r: 75, g: 0, b: 180 };
    const MID = { r: 110, g: 40, b: 210 };
    const LIGHT = { r: 155, g: 100, b: 235 };
    const PALE = { r: 180, g: 140, b: 245 };

    // Energy streaks
    const streaks: any[] = [];
    for (let i = 0; i < 35; i++) {
      streaks.push({
        angle: rng(0, Math.PI * 2), speed: rng(1, 4),
        headDist: 0, tailDist: 0, tailDelay: rng(0.05, 0.2),
        width: rng(0.5, 2.5), maxLen: rng(80, 300),
        maxDist: rng(diag * 0.3, diag * 0.7),
        opacity: rng(0.15, 0.5), born: rng(0, 0.4),
        active: false, done: false,
      });
    }
    for (let i = 0; i < 25; i++) {
      streaks.push({
        angle: rng(0, Math.PI * 2), speed: rng(0.8, 2.5),
        headDist: 0, tailDist: 0, tailDelay: rng(0.1, 0.3),
        width: rng(0.3, 1.8), maxLen: rng(60, 200),
        maxDist: rng(diag * 0.25, diag * 0.55),
        opacity: rng(0.1, 0.35), born: rng(0.8, 1.3),
        active: false, done: false,
      });
    }

    // Dust
    const dust: any[] = [];
    for (let i = 0; i < 200; i++) {
      const a = rng(0, Math.PI * 2); const spd = rng(0.2, 1.8);
      dust.push({
        x: cx + rng(-30, 30), y: cy + rng(-30, 30),
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        size: rng(0.5, 2), life: 1, decay: rng(0.001, 0.005),
        drift: rng(-0.02, 0.02), born: rng(0.1, 1.5), active: false,
      });
    }

    // Wisps
    const wisps: any[] = [];
    for (let i = 0; i < 20; i++) {
      const a = rng(0, Math.PI * 2); const spd = rng(0.5, 2);
      wisps.push({
        x: cx, y: cy, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        curve: rng(-0.02, 0.02), life: 1, decay: rng(0.002, 0.005),
        width: rng(1, 3), born: rng(0, 0.6), active: false, trail: [],
      });
    }
    for (let i = 0; i < 15; i++) {
      const a = rng(0, Math.PI * 2); const spd = rng(0.3, 1.5);
      wisps.push({
        x: cx + rng(-40, 40), y: cy + rng(-40, 40),
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        curve: rng(-0.03, 0.03), life: 1, decay: rng(0.0015, 0.004),
        width: rng(0.8, 2.5), born: rng(0.9, 1.5), active: false, trail: [],
      });
    }

    const rings = [
      { r: 0, max: diag * 0.55, spd: 2.5, op: 0.35, w: 1.5, born: 0.05, active: false },
      { r: 0, max: diag * 0.45, spd: 1.8, op: 0.25, w: 1, born: 0.5, active: false },
      { r: 0, max: diag * 0.65, spd: 3, op: 0.2, w: 1.2, born: 1.0, active: false },
    ];

    const beams: any[] = [];
    for (let i = 0; i < 8; i++) {
      beams.push({
        angle: (i / 8) * Math.PI * 2 + rng(-0.1, 0.1),
        width: rng(8, 25), length: diag * rng(0.3, 0.6),
        opacity: rng(0.03, 0.08), growSpeed: rng(0.4, 1),
      });
    }

    let shakeIntensity = 0;

    const draw = () => {
      const el = (Date.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      // Shake
      if (el < 0.8) shakeIntensity = Math.pow(1 - el / 0.8, 2) * 8;
      else if (el > 0.9 && el < 1.5) shakeIntensity = Math.pow(1 - (el - 0.9) / 0.6, 2) * 4;
      else shakeIntensity *= 0.95;
      if (shakeIntensity > 0.1) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity);
      }

      const gf = el > DURATION - 1.5 ? Math.max(0, 1 - (el - (DURATION - 1.5)) / 1.5) : 1;
      ctx.globalAlpha = gf;

      // Vignette
      const vs = el < 0.5 ? el / 0.5 : el > DURATION - 2 ? Math.max(0, 1 - (el - (DURATION - 2)) / 2) : 1;
      const vg = ctx.createRadialGradient(cx, cy, diag * 0.15, cx, cy, diag * 0.6);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(5,0,15,${0.6 * vs})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      // Bloom
      if (el < 2) {
        const p = el / 2; const a = Math.pow(1 - p, 1.5) * 0.7; const r = 20 + p * diag * 0.15;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${PALE.r},${PALE.g},${PALE.b},${a})`);
        g.addColorStop(0.2, `rgba(${MID.r},${MID.g},${MID.b},${a * 0.6})`);
        g.addColorStop(0.5, `rgba(${DEEP.r},${DEEP.g},${DEEP.b},${a * 0.25})`);
        g.addColorStop(1, 'rgba(30,0,60,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      if (el > 0.85 && el < 2.5) {
        const p = (el - 0.85) / 1.65; const a = Math.sin(p * Math.PI) * 0.35;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15 + p * 180);
        g.addColorStop(0, `rgba(${LIGHT.r},${LIGHT.g},${LIGHT.b},${a})`);
        g.addColorStop(1, `rgba(${DEEP.r},${DEEP.g},${DEEP.b},0)`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      // Beams
      if (el < 4) {
        const bf = el < 0.3 ? el / 0.3 : Math.max(0, 1 - (el - 1) / 3);
        beams.forEach((b: any) => {
          const grow = Math.min(1, el / b.growSpeed); const len = b.length * grow;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.angle + el * 0.008);
          const hw = b.width * (0.5 + bf * 0.5);
          const g = ctx.createLinearGradient(0, 0, len, 0);
          g.addColorStop(0, `rgba(${LIGHT.r},${LIGHT.g},${LIGHT.b},${b.opacity * bf})`);
          g.addColorStop(0.3, `rgba(${MID.r},${MID.g},${MID.b},${b.opacity * bf * 0.5})`);
          g.addColorStop(1, `rgba(${DEEP.r},${DEEP.g},${DEEP.b},0)`);
          ctx.fillStyle = g; ctx.beginPath();
          ctx.moveTo(0, -hw * 0.3); ctx.lineTo(len, -hw); ctx.lineTo(len, hw); ctx.lineTo(0, hw * 0.3);
          ctx.closePath(); ctx.fill(); ctx.restore();
        });
      }

      // Rings
      rings.forEach((ring) => {
        if (!ring.active && el >= ring.born) ring.active = true;
        if (!ring.active) return;
        ring.r += ring.spd; const p = ring.r / ring.max; if (p > 1) return;
        const a = ring.op * Math.pow(1 - p, 2);
        ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${MID.r},${MID.g},${MID.b},${a})`;
        ctx.lineWidth = ring.w * (1 - p * 0.6); ctx.stroke();
      });

      // Streaks
      streaks.forEach((s: any) => {
        if (!s.active && el >= s.born) s.active = true;
        if (!s.active || s.done) return;
        s.headDist += s.speed;
        if (el - s.born > s.tailDelay) s.tailDist += s.speed * 1.1;
        if (s.tailDist > s.maxDist + s.maxLen) { s.done = true; return; }
        const hd = Math.min(s.headDist, s.maxDist); const td = Math.min(s.tailDist, s.maxDist);
        if (hd - td <= 0) return;
        const hx = cx + Math.cos(s.angle) * hd; const hy = cy + Math.sin(s.angle) * hd;
        const tx = cx + Math.cos(s.angle) * td; const ty = cy + Math.sin(s.angle) * td;
        const fo = hd > s.maxDist * 0.7 ? Math.max(0, 1 - (hd - s.maxDist * 0.7) / (s.maxDist * 0.3)) : 1;
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, `rgba(${DEEP.r},${DEEP.g},${DEEP.b},0)`);
        g.addColorStop(0.3, `rgba(${MID.r},${MID.g},${MID.b},${s.opacity * fo * 0.5})`);
        g.addColorStop(0.8, `rgba(${LIGHT.r},${LIGHT.g},${LIGHT.b},${s.opacity * fo})`);
        g.addColorStop(1, `rgba(${PALE.r},${PALE.g},${PALE.b},${s.opacity * fo * 0.8})`);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy);
        ctx.strokeStyle = g; ctx.lineWidth = s.width; ctx.lineCap = 'round'; ctx.stroke();
        if (fo > 0.3) {
          ctx.save();
          ctx.shadowColor = `rgba(${LIGHT.r},${LIGHT.g},${LIGHT.b},${fo * 0.4})`;
          ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(hx, hy, s.width * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${PALE.r},${PALE.g},${PALE.b},${fo * s.opacity * 0.6})`;
          ctx.fill(); ctx.restore();
        }
      });

      // Wisps
      wisps.forEach((w: any) => {
        if (!w.active && el >= w.born) w.active = true;
        if (!w.active || w.life <= 0) return;
        w.trail.push({ x: w.x, y: w.y, life: w.life });
        if (w.trail.length > 30) w.trail.shift();
        const ang = Math.atan2(w.vy, w.vx) + w.curve;
        const spd = Math.sqrt(w.vx * w.vx + w.vy * w.vy) * 0.998;
        w.vx = Math.cos(ang) * spd; w.vy = Math.sin(ang) * spd;
        w.x += w.vx; w.y += w.vy; w.life -= w.decay;
        if (w.trail.length > 2) {
          for (let i = 2; i < w.trail.length; i++) {
            const tp = i / w.trail.length;
            ctx.beginPath(); ctx.moveTo(w.trail[i - 1].x, w.trail[i - 1].y);
            ctx.lineTo(w.trail[i].x, w.trail[i].y);
            ctx.strokeStyle = `rgba(${LIGHT.r},${LIGHT.g},${LIGHT.b},${tp * w.trail[i].life * 0.4})`;
            ctx.lineWidth = w.width * tp; ctx.lineCap = 'round'; ctx.stroke();
          }
          ctx.save();
          ctx.shadowColor = `rgba(${PALE.r},${PALE.g},${PALE.b},${w.life * 0.5})`;
          ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(w.x, w.y, w.width * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${PALE.r},${PALE.g},${PALE.b},${w.life * 0.7})`;
          ctx.fill(); ctx.restore();
        }
      });

      // Dust
      dust.forEach((d: any) => {
        if (!d.active && el >= d.born) d.active = true;
        if (!d.active || d.life <= 0) return;
        d.x += d.vx; d.y += d.vy; d.vx += d.drift; d.vy *= 0.999; d.vx *= 0.999; d.life -= d.decay;
        ctx.fillStyle = `rgba(${LIGHT.r},${LIGHT.g},${LIGHT.b},${d.life * 0.5})`;
        ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
      });

      // Haze
      if (el > 0.5 && el < DURATION - 0.5) {
        const hi = Math.min(1, (el - 0.5) / 1);
        const ho = el > DURATION - 2.5 ? Math.max(0, 1 - (el - (DURATION - 2.5)) / 2) : 1;
        const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, diag * 0.35);
        hg.addColorStop(0, `rgba(${MID.r},${MID.g},${MID.b},${0.04 * hi * ho})`);
        hg.addColorStop(1, `rgba(${DEEP.r},${DEEP.g},${DEEP.b},0)`);
        ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
      }

      // Core
      if (el < DURATION - 1) {
        const cd = Math.max(0, 1 - el / (DURATION - 1));
        const cp = 0.7 + 0.3 * Math.sin(el * 2);
        const cr = 30 + el * 6;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        cg.addColorStop(0, `rgba(${LIGHT.r},${LIGHT.g},${LIGHT.b},${0.08 * cd * cp})`);
        cg.addColorStop(1, `rgba(${DEEP.r},${DEEP.g},${DEEP.b},0)`);
        ctx.fillStyle = cg; ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
      }

      ctx.globalAlpha = 1;
      if (shakeIntensity > 0.1) ctx.restore();

      if (el < DURATION) {
        frameRef.current = requestAnimationFrame(draw);
      } else {
        setVisible(false);
        if (onComplete) onComplete();
      }
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}
    />
  );
}
