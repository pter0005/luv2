'use client';
/**
 * EasterEggIntro — container-aware "crack the egg" intro overlay.
 * 5 taps to break, then reveals the page behind it.
 *
 * 100 % Canvas 2D — no Three.js, no heavy deps, ~60 fps on mid-range phones.
 * Uses ResizeObserver to fit inside any parent container (phone mockup or fullscreen).
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── constants ───────────────────────────────────────────────────────────────
const TOTAL = 5;

const MSGS = [
  'Toque no ovo para revelar',
  'Hmm… algo está saindo 👀',
  'Continue quebrando!',
  'Quase lá… mais um pouco!',
  'ÚLTIMO TOQUE! 💥',
];

// ─── types ───────────────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number;
  color: string; type: 'circle' | 'heart' | 'rect';
  rot: number; rotV: number;
}
interface Star { x: number; y: number; r: number; phase: number; speed: number }
interface FloatingItem {
  x: number; y: number; vy: number; vx: number;
  size: number; opacity: number; rot: number; rotV: number;
  type: 'heart' | 'star' | 'dot'; color: string;
}

// ─── palette ─────────────────────────────────────────────────────────────────
const EASTER_COLORS = [
  '#ff6b9d', '#ffb347', '#a8e063', '#7ec8e3', '#c77dff',
  '#ffd166', '#ef476f', '#06d6a0', '#ffc8dd', '#ff9ab8',
];

// ─── draw helpers ────────────────────────────────────────────────────────────
function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s, -s * 0.5, -s, s * 0.6, 0, s * 1.1);
  ctx.bezierCurveTo(s, s * 0.6, s, -s * 0.5, 0, s * 0.3);
  ctx.fill();
  ctx.restore();
}

function drawStar4(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const d = i % 2 === 0 ? r : r * 0.4;
    ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
  }
  ctx.closePath(); ctx.fill();
}

// ─── paint the decorated egg onto an offscreen canvas ────────────────────────
function createEggSprite(eggW: number, eggH: number, dpr: number): HTMLCanvasElement {
  const pad = 20;
  const c = document.createElement('canvas');
  const totalW = eggW + pad * 2;
  const totalH = eggH + pad * 2;
  c.width = totalW * dpr; c.height = totalH * dpr;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const cx = totalW / 2, cy = totalH / 2;
  const rx = eggW / 2, ry = eggH / 2;

  // shadow
  ctx.save();
  ctx.shadowColor = 'rgba(200,100,255,0.4)';
  ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f0c0dd'; ctx.fill();
  ctx.restore();

  // egg body gradient
  const grad = ctx.createRadialGradient(cx - rx * 0.25, cy - ry * 0.3, rx * 0.1, cx, cy, ry);
  grad.addColorStop(0, '#ffe8f4');
  grad.addColorStop(0.4, '#f5c0dc');
  grad.addColorStop(1, '#d898b8');
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad; ctx.fill();

  // clip to egg
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();

  // zigzag stripes
  ctx.strokeStyle = 'rgba(200,120,170,0.5)';
  ctx.lineWidth = 1.8;
  for (const baseY of [cy - ry * 0.42, cy + ry * 0.42]) {
    ctx.beginPath();
    for (let x = cx - rx; x <= cx + rx; x += 4)
      ctx.lineTo(x, baseY + Math.sin((x - cx) * 0.12) * rx * 0.08);
    ctx.stroke();
  }

  // wavy band
  ctx.fillStyle = 'rgba(255,210,230,0.35)';
  ctx.beginPath();
  for (let x = cx - rx; x <= cx + rx; x += 2) ctx.lineTo(x, cy - ry * 0.08 + Math.sin(x * 0.08) * ry * 0.04);
  for (let x = cx + rx; x >= cx - rx; x -= 2) ctx.lineTo(x, cy + ry * 0.08 + Math.sin(x * 0.08) * ry * 0.04);
  ctx.closePath(); ctx.fill();

  // hearts
  ctx.fillStyle = '#ff6b8a';
  const hearts = [[-0.25, 0], [0.28, -0.05], [0, 0.25], [-0.15, -0.28], [0.2, 0.2]];
  hearts.forEach(([ox, oy]) => drawHeart(ctx, cx + rx * ox, cy + ry * oy, rx * 0.1));

  // golden dots
  ctx.fillStyle = '#ffd700';
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.8;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, 1 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.2, cy - ry * 0.25, rx * 0.25, ry * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // un-clip
  return c;
}

// ─── crack path definitions (in 0-1 egg-local coords) ───────────────────────
const CRACKS: Array<Array<[number, number]>> = [
  [[0.5, 0.12], [0.47, 0.22], [0.53, 0.28], [0.48, 0.38]],
  [[0.48, 0.38], [0.42, 0.48], [0.49, 0.54], [0.53, 0.28], [0.58, 0.38], [0.54, 0.5]],
  [[0.42, 0.48], [0.33, 0.54], [0.36, 0.62], [0.54, 0.5], [0.66, 0.54], [0.63, 0.62]],
  [[0.33, 0.54], [0.24, 0.6], [0.28, 0.7], [0.63, 0.62], [0.74, 0.64], [0.7, 0.74], [0.49, 0.54], [0.5, 0.72]],
];

// ─── bunny sprite (drawn procedurally) ──────────────────────────────────────
function drawBunny(ctx: CanvasRenderingContext2D, bx: number, by: number, scale: number, earAngle: number) {
  ctx.save(); ctx.translate(bx, by); ctx.scale(scale, scale);
  const body = '#f5e0d0', pink = '#ffc0d0', dark = '#2d1b10';

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.ellipse(0, 52, 20, 4, 0, 0, Math.PI * 2); ctx.fill();

  // ears
  for (const side of [-1, 1]) {
    ctx.save(); ctx.translate(side * 18, -38);
    ctx.rotate(side * earAngle);
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, -14, 7, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pink;
    ctx.beginPath(); ctx.ellipse(0, -12, 4, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // body
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, 18, 20, 22, 0, 0, Math.PI * 2); ctx.fill();
  // belly
  ctx.fillStyle = '#faf2ec';
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.ellipse(0, 20, 13, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // tail
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(20, 12, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(22, 9, 4, 0, Math.PI * 2); ctx.fill();

  // head
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(0, -14, 16, 0, Math.PI * 2); ctx.fill();

  // eyes
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(-6, -16, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, -16, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(-5, -17.5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -17.5, 1.2, 0, Math.PI * 2); ctx.fill();

  // nose
  ctx.fillStyle = pink;
  ctx.beginPath(); ctx.ellipse(0, -10, 2.5, 1.8, 0, 0, Math.PI * 2); ctx.fill();

  // mouth
  ctx.strokeStyle = '#d4a08a'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, -8); ctx.quadraticCurveTo(0, -5, 3, -8); ctx.stroke();

  // cheeks
  ctx.fillStyle = 'rgba(255,150,180,0.25)';
  ctx.beginPath(); ctx.arc(-12, -10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -10, 4, 0, Math.PI * 2); ctx.fill();

  // paws
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(-10, 38, 7, 4.5, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, 38, 7, 4.5, 0.15, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
interface Props {
  onReveal: () => void;
}

export default function EasterEggIntro({ onReveal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef(0);
  const [stage, setStage] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Mutable animation state (no re-renders)
  const anim = useRef({
    shakeT: -10,
    particles: [] as Particle[],
    stars: [] as Star[],
    floats: [] as FloatingItem[],
    eggSprite: null as HTMLCanvasElement | null,
    explodeT: -1,
    bunnyPhase: 0,
    earAngle: 0,
    frame: 0,
    W: 0, H: 0, dpr: 1,
    eggW: 0, eggH: 0,
  });

  // ── handle tap ──────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    const s = stageRef.current;
    if (s >= TOTAL) return;
    const next = s + 1;
    stageRef.current = next;
    setStage(next);
    anim.current.shakeT = performance.now();

    // crack particles burst
    const { W, H, particles } = anim.current;
    const cx = W / 2, cy = H * 0.38;
    for (let i = 0; i < 10 + next * 4; i++) {
      const a = Math.random() * Math.PI * 2, spd = 1 + Math.random() * 2.5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 1,
        life: 1, decay: 0.015 + Math.random() * 0.01,
        size: 1.5 + Math.random() * 2.5,
        color: EASTER_COLORS[Math.floor(Math.random() * EASTER_COLORS.length)],
        type: 'circle', rot: 0, rotV: 0,
      });
    }

    if (next === TOTAL) {
      anim.current.explodeT = performance.now();
      // confetti burst — scaled to container
      const count = Math.min(120, Math.floor(W * H / 2000));
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 7;
        particles.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - Math.random() * 3,
          life: 1, decay: 0.006 + Math.random() * 0.006,
          size: 3 + Math.random() * 6,
          color: EASTER_COLORS[Math.floor(Math.random() * EASTER_COLORS.length)],
          type: (['circle', 'heart', 'rect'] as const)[Math.floor(Math.random() * 3)],
          rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.15,
        });
      }
      setTimeout(() => { setRevealed(true); onReveal(); }, 3200);
    }
  }, [onReveal]);

  // ── canvas setup + animation loop ──────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d')!;
    const a = anim.current;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      a.dpr = Math.min(window.devicePixelRatio || 1, 2);
      a.W = rect.width;
      a.H = rect.height;
      canvas.width = a.W * a.dpr;
      canvas.height = a.H * a.dpr;
      canvas.style.width = a.W + 'px';
      canvas.style.height = a.H + 'px';

      // Egg size — proportional to container, capped small
      const minDim = Math.min(a.W, a.H);
      a.eggW = minDim * 0.28;
      a.eggH = minDim * 0.36;
      a.eggSprite = createEggSprite(a.eggW, a.eggH, a.dpr);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // init stars
    a.stars = Array.from({ length: 35 }, () => ({
      x: Math.random() * a.W, y: Math.random() * a.H,
      r: 0.4 + Math.random() * 1.2, phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));

    // init floating items
    a.floats = Array.from({ length: 12 }, () => ({
      x: Math.random() * a.W, y: a.H + Math.random() * a.H,
      vy: -(0.2 + Math.random() * 0.4), vx: (Math.random() - 0.5) * 0.2,
      size: 5 + Math.random() * 8, opacity: 0.06 + Math.random() * 0.12,
      rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.01,
      type: (['heart', 'star', 'dot'] as const)[Math.floor(Math.random() * 3)],
      color: EASTER_COLORS[Math.floor(Math.random() * EASTER_COLORS.length)],
    }));

    let raf = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const { W, H, dpr, stars, floats, particles, eggSprite, eggW, eggH } = a;
      if (W === 0 || H === 0) return;
      const cx = W / 2, cy = H * 0.38;
      const stage = stageRef.current;
      const t = now * 0.001;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // ── background gradient ──
      const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
      bg.addColorStop(0, '#1a0a2e');
      bg.addColorStop(0.35, '#2d1152');
      bg.addColorStop(0.7, '#1e0840');
      bg.addColorStop(1, '#0d051a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // ── stars ──
      stars.forEach(s => {
        const twinkle = 0.1 + Math.sin(t * s.speed + s.phase) * 0.45 + 0.45;
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── floating items ──
      floats.forEach(f => {
        f.y += f.vy; f.x += f.vx; f.rot += f.rotV;
        if (f.y < -20) { f.y = H + 15; f.x = Math.random() * W; }
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
        ctx.globalAlpha = f.opacity; ctx.fillStyle = f.color;
        if (f.type === 'heart') drawHeart(ctx, 0, 0, f.size * 0.4);
        else if (f.type === 'star') drawStar4(ctx, 0, 0, f.size * 0.4);
        else { ctx.beginPath(); ctx.arc(0, 0, f.size * 0.25, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      ctx.globalAlpha = 1;

      // ── egg halo ──
      const haloI = 0.12 + stage * 0.06;
      const haloR = Math.max(eggW, eggH) * (1.2 + stage * 0.15);
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
      halo.addColorStop(0, `rgba(${stage >= 3 ? '255,180,80' : '220,160,255'},${haloI})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo; ctx.fillRect(cx - haloR, cy - haloR, haloR * 2, haloR * 2);

      // ── shake transform ──
      const shakeElapsed = (now - a.shakeT) / 1000;
      let sx = 0, sy = 0;
      if (shakeElapsed < 0.35) {
        const str = (1 - shakeElapsed / 0.35) * (2 + stage * 1.5);
        sx = Math.sin(now * 0.03) * str;
        sy = Math.cos(now * 0.025) * str * 0.6;
      }

      // ── egg sprite ──
      const eggPad = 20;
      const eggSpriteW = eggW + eggPad * 2;
      const eggSpriteH = eggH + eggPad * 2;
      const eggX = cx - eggSpriteW / 2;
      const eggY = cy - eggSpriteH / 2;

      if (stage < TOTAL && eggSprite) {
        const floatY = Math.sin(t * 1.3) * 3;
        ctx.save();
        ctx.translate(sx, sy + floatY);
        ctx.drawImage(eggSprite, 0, 0, eggSprite.width, eggSprite.height, eggX, eggY, eggSpriteW, eggSpriteH);
        ctx.restore();
      }

      // ── exploding egg halves ──
      if (stage >= TOTAL && eggSprite) {
        const ep = Math.min(1, (now - a.explodeT) / 2200);
        const ease = 1 - Math.pow(1 - ep, 3);
        const halfH = eggSpriteH / 2;

        // top half — fly up-left
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - ep * 1.4);
        ctx.translate(cx - ease * eggW * 0.6, cy - ease * eggH * 0.8);
        ctx.rotate(-ease * 0.5);
        ctx.beginPath();
        ctx.rect(-eggSpriteW / 2, -halfH, eggSpriteW, halfH);
        ctx.clip();
        ctx.drawImage(eggSprite, 0, 0, eggSprite.width, eggSprite.height, -eggSpriteW / 2, -eggSpriteH / 2, eggSpriteW, eggSpriteH);
        ctx.restore();

        // bottom half — fly down-right
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - ep * 1.4);
        ctx.translate(cx + ease * eggW * 0.5, cy + ease * eggH * 0.7);
        ctx.rotate(ease * 0.4);
        ctx.beginPath();
        ctx.rect(-eggSpriteW / 2, 0, eggSpriteW, halfH);
        ctx.clip();
        ctx.drawImage(eggSprite, 0, 0, eggSprite.width, eggSprite.height, -eggSpriteW / 2, -eggSpriteH / 2, eggSpriteW, eggSpriteH);
        ctx.restore();

        // golden orb
        if (ep < 0.8) {
          const orbR = 20 * (1 - ep);
          const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR);
          orb.addColorStop(0, `rgba(255,220,100,${0.9 * (1 - ep)})`);
          orb.addColorStop(1, 'rgba(255,180,60,0)');
          ctx.fillStyle = orb;
          ctx.fillRect(cx - orbR, cy - orbR, orbR * 2, orbR * 2);
        }
      }

      // ── cracks (drawn on top of egg) ──
      if (stage > 0 && stage < TOTAL) {
        const rx = eggW / 2, ry = eggH / 2;
        ctx.save();
        ctx.translate(sx, sy + Math.sin(t * 1.3) * 3);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let ci = 0; ci < Math.min(stage, CRACKS.length); ci++) {
          const pts = CRACKS[ci];
          const glow = stage >= 3 ? 5 : 2;
          ctx.shadowColor = ci === stage - 1 ? '#ffa500' : '#cc8800';
          ctx.shadowBlur = glow;
          ctx.strokeStyle = ['#d4a800', '#e08a10', '#e06018', '#d03020'][ci] || '#d03020';
          ctx.lineWidth = ci === stage - 1 ? 2.2 : 1.6;
          ctx.beginPath();
          pts.forEach(([px, py], j) => {
            const x = cx + (px - 0.5) * rx * 2;
            const y = cy + (py - 0.5) * ry * 2;
            j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── particles ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.993;
        p.life -= p.decay; p.rot += p.rotV;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        if (p.type === 'heart') { ctx.scale(0.4, 0.4); drawHeart(ctx, 0, -p.size, p.size); }
        else if (p.type === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ── inner glow through cracks ──
      if (stage > 0 && stage < TOTAL) {
        const glowI = 0.05 + stage * 0.04 + Math.sin(t * 3) * 0.02;
        const gr = Math.max(eggW, eggH) * 0.6;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
        g.addColorStop(0, `rgba(255,200,80,${glowI})`);
        g.addColorStop(1, 'rgba(255,180,60,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - gr, cy - gr, gr * 2, gr * 2);
      }

      // ── bunny ──
      if (stage < TOTAL || (now - a.explodeT) < 2500) {
        a.bunnyPhase += 0.045;
        const hopY = Math.abs(Math.sin(a.bunnyPhase * 0.7)) * 12;
        const squash = 1 - Math.abs(Math.sin(a.bunnyPhase * 0.7)) * 0.05;
        a.earAngle = Math.sin(a.bunnyPhase * 0.7 + 0.3) * 0.08;
        const bunnyScale = Math.min(W, H) * 0.0018 + 0.35;
        const bx = W / 2, by = H - 30 - hopY;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(1 + (1 - squash) * 0.4, squash);
        ctx.translate(-bx, -by);
        const bunnyAlpha = stage >= TOTAL ? Math.max(0, 1 - (now - a.explodeT) / 2500) : 1;
        ctx.globalAlpha = bunnyAlpha;
        drawBunny(ctx, bx, by, bunnyScale, a.earAngle);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // ── grass strip ──
      const grassH = 18;
      const grassG = ctx.createLinearGradient(0, H - grassH, 0, H);
      grassG.addColorStop(0, 'rgba(50,140,40,0)');
      grassG.addColorStop(0.5, 'rgba(50,140,40,0.15)');
      grassG.addColorStop(1, 'rgba(40,110,30,0.3)');
      ctx.fillStyle = grassG; ctx.fillRect(0, H - grassH, W, grassH);

      a.frame++;
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  if (revealed) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      style={{
        position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden',
        cursor: stage < TOTAL ? 'pointer' : 'default', touchAction: 'manipulation',
        borderRadius: 'inherit',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* UI overlay — message + progress */}
      <AnimatePresence mode="wait">
        {stage < TOTAL && (
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute', top: '6%', left: 0, right: 0, textAlign: 'center',
              color: 'rgba(255,220,240,0.9)', fontSize: 'clamp(13px, 4vw, 20px)',
              fontFamily: "'Dancing Script', cursive", fontWeight: 700,
              textShadow: '0 2px 12px rgba(200,80,255,0.5)',
              padding: '0 16px', zIndex: 10, pointerEvents: 'none',
            }}
          >
            {MSGS[stage]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* progress dots */}
      {stage < TOTAL && (
        <div style={{
          position: 'absolute', bottom: '10%', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 7, zIndex: 10, pointerEvents: 'none',
        }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.3)',
              backgroundColor: i < stage ? '#ff6b9d' : 'rgba(255,255,255,0.12)',
              boxShadow: i < stage ? '0 0 6px rgba(255,107,157,0.5)' : 'none',
              transition: 'all 0.3s ease',
              transform: i === stage - 1 ? 'scale(1.3)' : 'scale(1)',
            }} />
          ))}
        </div>
      )}

      {/* Easter label — stage 0 */}
      <AnimatePresence>
        {stage === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{
              position: 'absolute', bottom: '15%', left: 0, right: 0, textAlign: 'center',
              color: 'rgba(255,200,230,0.5)', fontSize: 11, letterSpacing: 1.5,
              fontWeight: 500, pointerEvents: 'none', zIndex: 10,
            }}
          >
            🐣 Surpresa de Páscoa 🐣
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
