'use client';
/**
 * EasterEggIntro v3 — premium "crack the egg" intro overlay.
 * Container-aware (works in phone mockup or fullscreen).
 * Pure Canvas 2D — 60fps on mid-range phones.
 *
 * Features:
 * - 3D-looking egg with rotating specular highlight
 * - Ground shadow + pulse ring
 * - Detailed bunny with reactions
 * - Bezier curve cracks with golden light bleeding through
 * - Shell fragments with physics on each tap
 * - Haptic feedback + white flash on tap
 * - Background color shifts per stage
 * - Petal/flower particles
 * - Epic final explosion with light beam + screen shake
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── constants ───────────────────────────────────────────────────────────────
const TOTAL = 5;
const MSGS = [
  'Toque no ovo para revelar ✨',
  'Hmm… algo está saindo 👀',
  'Continue quebrando! 💫',
  'Quase lá… mais um pouco! 🔥',
  'ÚLTIMO TOQUE! 💥',
];

// ─── types ───────────────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number;
  color: string; type: 'circle' | 'heart' | 'rect' | 'shell' | 'petal';
  rot: number; rotV: number; gravity: number;
}
interface Star { x: number; y: number; r: number; phase: number; speed: number }
interface FloatingItem {
  x: number; y: number; vy: number; vx: number;
  size: number; opacity: number; rot: number; rotV: number;
  type: 'heart' | 'star' | 'petal' | 'flower'; color: string;
  wobblePhase: number; wobbleSpeed: number;
}
interface ShellFragment {
  x: number; y: number; vx: number; vy: number;
  rot: number; rotV: number; size: number;
  color: string; life: number; gravity: number;
}

// ─── palette ─────────────────────────────────────────────────────────────────
const EASTER_COLORS = [
  '#ff6b9d', '#ffb347', '#a8e063', '#7ec8e3', '#c77dff',
  '#ffd166', '#ef476f', '#06d6a0', '#ffc8dd', '#ff9ab8',
];
const SHELL_COLORS = ['#f5c0dc', '#ffe8f4', '#e8b0cc', '#ffd6e8', '#d898b8'];
const PETAL_COLORS = ['#ffc8dd', '#ffb3c6', '#ff8fab', '#ffa6c1', '#ffe0eb'];

// ─── BG colors per stage (progressively warmer) ─────────────────────────────
const BG_STAGES = [
  { t: '#1a0a2e', m: '#2d1152', b: '#0d051a' },
  { t: '#1e0c30', m: '#321458', b: '#120820' },
  { t: '#241035', m: '#3a185f', b: '#180c28' },
  { t: '#2c1438', m: '#441c66', b: '#201030' },
  { t: '#341838', m: '#4e206e', b: '#281438' },
  { t: '#3c1c3a', m: '#582476', b: '#301840' },
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

function drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s * 0.3, -s, 0, -s * 1.1);
  ctx.bezierCurveTo(s * 0.3, -s, s * 0.5, -s * 0.3, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i / 5) * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.5, s * 0.25, s * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ─── paint decorated egg (offscreen) ────────────────────────────────────────
function createEggSprite(eggW: number, eggH: number, dpr: number): HTMLCanvasElement {
  const pad = 24;
  const c = document.createElement('canvas');
  const tw = eggW + pad * 2, th = eggH + pad * 2;
  c.width = tw * dpr; c.height = th * dpr;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const cx = tw / 2, cy = th / 2;
  const rx = eggW / 2, ry = eggH / 2;

  // outer shadow
  ctx.save();
  ctx.shadowColor = 'rgba(180,80,220,0.5)';
  ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e8a8cc'; ctx.fill();
  ctx.restore();

  // egg body — rich multi-stop gradient
  const grad = ctx.createRadialGradient(cx - rx * 0.2, cy - ry * 0.25, rx * 0.05, cx + rx * 0.1, cy + ry * 0.1, ry * 1.1);
  grad.addColorStop(0, '#fff4f9');
  grad.addColorStop(0.15, '#ffe8f4');
  grad.addColorStop(0.4, '#f5c0dc');
  grad.addColorStop(0.7, '#e0a0c0');
  grad.addColorStop(1, '#c88aa8');
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad; ctx.fill();

  // thin outline
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(160,80,120,0.2)'; ctx.lineWidth = 1; ctx.stroke();

  // clip to egg for decorations
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.clip();

  // zigzag stripes (top and bottom)
  for (const [baseY, color] of [[cy - ry * 0.38, 'rgba(200,120,170,0.5)'], [cy + ry * 0.38, 'rgba(180,100,150,0.4)']] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = cx - rx; x <= cx + rx; x += 3)
      ctx.lineTo(x, baseY + Math.sin((x - cx) * 0.15) * rx * 0.07);
    ctx.stroke();
  }

  // wavy middle band
  ctx.fillStyle = 'rgba(255,210,230,0.3)';
  ctx.beginPath();
  for (let x = cx - rx; x <= cx + rx; x += 2) ctx.lineTo(x, cy - ry * 0.06 + Math.sin(x * 0.1) * ry * 0.035);
  for (let x = cx + rx; x >= cx - rx; x -= 2) ctx.lineTo(x, cy + ry * 0.06 + Math.sin(x * 0.1) * ry * 0.035);
  ctx.closePath(); ctx.fill();

  // hearts
  ctx.fillStyle = '#ff6b8a';
  [[-0.25, 0.02], [0.28, -0.08], [0, 0.22], [-0.12, -0.25], [0.18, 0.18]].forEach(([ox, oy]) =>
    drawHeart(ctx, cx + rx * ox, cy + ry * oy, rx * 0.09));

  // tiny flowers
  drawFlower(ctx, cx - rx * 0.35, cy - ry * 0.15, rx * 0.06, '#ffe066');
  drawFlower(ctx, cx + rx * 0.3, cy + ry * 0.12, rx * 0.05, '#ffcc44');
  drawFlower(ctx, cx + rx * 0.05, cy - ry * 0.35, rx * 0.04, '#ffd866');

  // golden dots scatter
  ctx.fillStyle = '#ffd700';
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.8;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, 0.8 + Math.random() * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // top highlight (specular)
  const hl = ctx.createRadialGradient(cx - rx * 0.22, cy - ry * 0.3, 0, cx - rx * 0.22, cy - ry * 0.3, rx * 0.5);
  hl.addColorStop(0, 'rgba(255,255,255,0.45)');
  hl.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.15, cy - ry * 0.25, rx * 0.4, ry * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // bottom reflection
  const bl = ctx.createLinearGradient(cx, cy + ry * 0.5, cx, cy + ry);
  bl.addColorStop(0, 'rgba(255,255,255,0)');
  bl.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.fillStyle = bl;
  ctx.beginPath(); ctx.ellipse(cx, cy + ry * 0.6, rx * 0.6, ry * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // un-clip
  return c;
}

// ─── crack bezier paths (in 0-1 egg-local coords) ──────────────────────────
// Each crack is an array of {type, points} segments for bezier curves
type CrackSegment = { cp1x: number; cp1y: number; cp2x: number; cp2y: number; ex: number; ey: number };
type CrackPath = { startX: number; startY: number; segments: CrackSegment[] };

const CRACKS: CrackPath[] = [
  { startX: 0.5, startY: 0.08,
    segments: [
      { cp1x: 0.48, cp1y: 0.14, cp2x: 0.52, cp2y: 0.2, ex: 0.47, ey: 0.26 },
      { cp1x: 0.44, cp1y: 0.3, cp2x: 0.51, cp2y: 0.33, ex: 0.49, ey: 0.38 },
    ]},
  { startX: 0.49, startY: 0.38,
    segments: [
      { cp1x: 0.44, cp1y: 0.43, cp2x: 0.4, cp2y: 0.48, ex: 0.42, ey: 0.54 },
      { cp1x: 0.46, cp1y: 0.58, cp2x: 0.55, cp2y: 0.56, ex: 0.56, ey: 0.52 },
      { cp1x: 0.58, cp1y: 0.46, cp2x: 0.54, cp2y: 0.4, ex: 0.53, ey: 0.36 },
    ]},
  { startX: 0.42, startY: 0.54,
    segments: [
      { cp1x: 0.37, cp1y: 0.58, cp2x: 0.32, cp2y: 0.55, ex: 0.3, ey: 0.6 },
      { cp1x: 0.28, cp1y: 0.64, cp2x: 0.33, cp2y: 0.68, ex: 0.35, ey: 0.65 },
    ]},
  { startX: 0.56, startY: 0.52,
    segments: [
      { cp1x: 0.62, cp1y: 0.56, cp2x: 0.68, cp2y: 0.54, ex: 0.7, ey: 0.58 },
      { cp1x: 0.72, cp1y: 0.62, cp2x: 0.66, cp2y: 0.68, ex: 0.64, ey: 0.72 },
      { cp1x: 0.58, cp1y: 0.76, cp2x: 0.52, cp2y: 0.72, ex: 0.5, ey: 0.76 },
    ]},
];

// ─── detailed bunny ─────────────────────────────────────────────────────────
function drawBunny(ctx: CanvasRenderingContext2D, bx: number, by: number, scale: number, earAngle: number, lookUp: boolean) {
  ctx.save(); ctx.translate(bx, by); ctx.scale(scale, scale);
  const body = '#f5e0d0', pink = '#ffc0d0', dark = '#2d1b10', outline = '#e0c8b4';

  // shadow on ground
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath(); ctx.ellipse(0, 54, 22, 5, 0, 0, Math.PI * 2); ctx.fill();

  // ears
  for (const side of [-1, 1]) {
    ctx.save(); ctx.translate(side * 18, -38);
    ctx.rotate(side * earAngle);
    // outer ear
    ctx.fillStyle = body; ctx.strokeStyle = outline; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.ellipse(0, -14, 8, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // inner ear
    ctx.fillStyle = pink;
    ctx.beginPath(); ctx.ellipse(0, -12, 5, 16, 0, 0, Math.PI * 2); ctx.fill();
    // inner ear highlight
    ctx.fillStyle = 'rgba(255,200,220,0.3)';
    ctx.beginPath(); ctx.ellipse(-1, -14, 2.5, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // body
  ctx.fillStyle = body; ctx.strokeStyle = outline; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.ellipse(0, 18, 22, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // belly
  ctx.fillStyle = '#faf2ec';
  ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.ellipse(0, 20, 14, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // tail — fluffy with multiple circles
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(22, 12, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(24, 9, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, 8, 4, 0, Math.PI * 2); ctx.fill();

  // head
  const headY = lookUp ? -17 : -14;
  ctx.fillStyle = body; ctx.strokeStyle = outline; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.arc(0, headY, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // eyes — bigger when looking up
  const eyeSize = lookUp ? 3.2 : 2.8;
  const eyeY = headY - 2;
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(-7, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2); ctx.fill();
  // eye shine
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(-5.5, eyeY - 1.5, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8.5, eyeY - 1.5, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-7.5, eyeY + 0.5, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6.5, eyeY + 0.5, 0.7, 0, Math.PI * 2); ctx.fill();

  // eyebrows when excited (looking up)
  if (lookUp) {
    ctx.strokeStyle = dark; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, eyeY - 5); ctx.quadraticCurveTo(-7, eyeY - 7, -4, eyeY - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, eyeY - 5); ctx.quadraticCurveTo(7, eyeY - 7, 10, eyeY - 5); ctx.stroke();
  }

  // nose
  ctx.fillStyle = '#ffaabb';
  ctx.beginPath(); ctx.ellipse(0, headY + 5, 3, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  // nose highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.ellipse(-0.8, headY + 4.2, 1.2, 0.8, 0, 0, Math.PI * 2); ctx.fill();

  // mouth
  ctx.strokeStyle = '#d4a08a'; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
  const mouthY = headY + 8;
  ctx.beginPath(); ctx.moveTo(-3.5, mouthY); ctx.quadraticCurveTo(0, mouthY + 3.5, 3.5, mouthY); ctx.stroke();

  // whiskers
  ctx.strokeStyle = 'rgba(180,150,130,0.35)'; ctx.lineWidth = 0.6;
  for (const [sx, sy, ex, ey] of [[-16, headY + 3, -5, headY + 4], [-17, headY + 6, -5, headY + 6.5], [5, headY + 4, 16, headY + 3], [5, headY + 6.5, 17, headY + 6]]) {
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  }

  // rosy cheeks
  ctx.fillStyle = 'rgba(255,150,180,0.28)';
  ctx.beginPath(); ctx.arc(-13, headY + 4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(13, headY + 4, 5, 0, Math.PI * 2); ctx.fill();

  // front paws
  ctx.fillStyle = body; ctx.strokeStyle = outline; ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.ellipse(-11, 40, 8, 5, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(11, 40, 8, 5, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // paw pads
  ctx.fillStyle = 'rgba(255,192,208,0.45)';
  ctx.beginPath(); ctx.arc(-13, 41, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-9, 41, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9, 41, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(13, 41, 2, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
interface Props { onReveal: () => void }

export default function EasterEggIntro({ onReveal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef(0);
  const [stage, setStage] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const anim = useRef({
    shakeT: -10,
    flashT: -10,
    screenShakeT: -10,
    particles: [] as Particle[],
    shells: [] as ShellFragment[],
    stars: [] as Star[],
    floats: [] as FloatingItem[],
    eggSprite: null as HTMLCanvasElement | null,
    explodeT: -1,
    bunnyPhase: 0,
    earAngle: 0,
    specularAngle: 0,
    pulsePhase: 0,
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
    const now = performance.now();
    anim.current.shakeT = now;
    anim.current.flashT = now;

    // haptic
    try { navigator?.vibrate?.(next < TOTAL ? 30 : 80); } catch {}

    const { W, H, particles, shells, eggW, eggH } = anim.current;
    const cx = W / 2, cy = H * 0.36;

    // shell fragments
    for (let i = 0; i < 4 + next * 2; i++) {
      const a = Math.random() * Math.PI * 2, spd = 1.5 + Math.random() * 3;
      shells.push({
        x: cx + (Math.random() - 0.5) * eggW * 0.5,
        y: cy + (Math.random() - 0.5) * eggH * 0.3,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 2 - Math.random() * 2,
        rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.2,
        size: 3 + Math.random() * 5,
        color: SHELL_COLORS[Math.floor(Math.random() * SHELL_COLORS.length)],
        life: 1, gravity: 0.08 + Math.random() * 0.04,
      });
    }

    // sparkle particles from crack
    for (let i = 0; i < 8 + next * 3; i++) {
      const a = Math.random() * Math.PI * 2, spd = 0.8 + Math.random() * 2;
      particles.push({
        x: cx + (Math.random() - 0.5) * eggW * 0.3,
        y: cy + (Math.random() - 0.5) * eggH * 0.3,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 0.5,
        life: 1, decay: 0.018 + Math.random() * 0.012,
        size: 1 + Math.random() * 2.5,
        color: next >= 3 ? '#ffd700' : EASTER_COLORS[Math.floor(Math.random() * EASTER_COLORS.length)],
        type: 'circle', rot: 0, rotV: 0, gravity: 0.02,
      });
    }

    if (next === TOTAL) {
      anim.current.explodeT = now;
      anim.current.screenShakeT = now;

      // massive confetti burst in waves
      const count = Math.min(140, Math.floor(W * H / 1500));
      for (let wave = 0; wave < 3; wave++) {
        for (let i = 0; i < count / 3; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = (2 + Math.random() * 8) * (1 - wave * 0.15);
          const delay = wave * 0.15;
          particles.push({
            x: cx + (Math.random() - 0.5) * 15,
            y: cy + (Math.random() - 0.5) * 15,
            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - Math.random() * 4 - wave,
            life: 1 + delay, decay: 0.005 + Math.random() * 0.005,
            size: 3 + Math.random() * 7,
            color: EASTER_COLORS[Math.floor(Math.random() * EASTER_COLORS.length)],
            type: (['circle', 'heart', 'rect', 'petal'] as const)[Math.floor(Math.random() * 4)],
            rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.18,
            gravity: 0.04 + Math.random() * 0.03,
          });
        }
      }

      // big shell fragments
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2, spd = 3 + Math.random() * 6;
        shells.push({
          x: cx + (Math.random() - 0.5) * eggW * 0.4,
          y: cy + (Math.random() - 0.5) * eggH * 0.4,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 3 - Math.random() * 3,
          rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.3,
          size: 6 + Math.random() * 10,
          color: SHELL_COLORS[Math.floor(Math.random() * SHELL_COLORS.length)],
          life: 1, gravity: 0.1 + Math.random() * 0.05,
        });
      }

      setTimeout(() => { setRevealed(true); onReveal(); }, 3000);
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
      a.W = rect.width; a.H = rect.height;
      canvas.width = a.W * a.dpr; canvas.height = a.H * a.dpr;
      canvas.style.width = a.W + 'px'; canvas.style.height = a.H + 'px';
      const minDim = Math.min(a.W, a.H);
      a.eggW = minDim * 0.26;
      a.eggH = minDim * 0.34;
      a.eggSprite = createEggSprite(a.eggW, a.eggH, a.dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // init stars
    a.stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * a.W, y: Math.random() * a.H,
      r: 0.3 + Math.random() * 1.3, phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.5,
    }));

    // init floating items (hearts, petals, flowers)
    a.floats = Array.from({ length: 14 }, (_, i) => ({
      x: Math.random() * a.W, y: a.H + Math.random() * a.H,
      vy: -(0.15 + Math.random() * 0.35), vx: (Math.random() - 0.5) * 0.15,
      size: 4 + Math.random() * 9, opacity: 0.05 + Math.random() * 0.12,
      rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.008,
      type: (['heart', 'petal', 'flower', 'star'] as const)[i % 4],
      color: i % 4 === 1 ? PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]
        : EASTER_COLORS[Math.floor(Math.random() * EASTER_COLORS.length)],
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 1,
    }));

    let raf = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const { W, H, dpr, stars, floats, particles, shells, eggSprite, eggW, eggH } = a;
      if (W === 0 || H === 0) return;
      const cx = W / 2, cy = H * 0.36;
      const stage = stageRef.current;
      const t = now * 0.001;

      // screen shake on final explosion
      let ssx = 0, ssy = 0;
      const screenShakeEl = (now - a.screenShakeT) / 1000;
      if (screenShakeEl < 0.6 && screenShakeEl >= 0) {
        const str = (1 - screenShakeEl / 0.6) * 8;
        ssx = Math.sin(now * 0.04) * str;
        ssy = Math.cos(now * 0.035) * str * 0.7;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.translate(ssx, ssy);
      ctx.clearRect(-10, -10, W + 20, H + 20);

      // ── background gradient (shifts with stage) ──
      const bg0 = BG_STAGES[Math.min(stage, BG_STAGES.length - 1)];
      const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
      bg.addColorStop(0, bg0.t);
      bg.addColorStop(0.45, bg0.m);
      bg.addColorStop(1, bg0.b);
      ctx.fillStyle = bg; ctx.fillRect(-10, -10, W + 20, H + 20);

      // subtle radial vignette
      const vig = ctx.createRadialGradient(cx, cy, W * 0.1, cx, cy, W * 0.9);
      vig.addColorStop(0, 'rgba(60,20,80,0.0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = vig; ctx.fillRect(-10, -10, W + 20, H + 20);

      // ── stars ──
      stars.forEach(s => {
        const tw = 0.15 + Math.sin(t * s.speed + s.phase) * 0.4 + 0.45;
        ctx.globalAlpha = tw;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        // bigger stars get a cross
        if (s.r > 1) {
          ctx.strokeStyle = `rgba(255,255,255,${tw * 0.3})`;
          ctx.lineWidth = 0.3;
          ctx.beginPath(); ctx.moveTo(s.x - s.r * 2, s.y); ctx.lineTo(s.x + s.r * 2, s.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(s.x, s.y - s.r * 2); ctx.lineTo(s.x, s.y + s.r * 2); ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      // ── floating items ──
      floats.forEach(f => {
        f.y += f.vy; f.x += f.vx + Math.sin(t * f.wobbleSpeed + f.wobblePhase) * 0.3;
        f.rot += f.rotV;
        if (f.y < -25) { f.y = H + 20; f.x = Math.random() * W; }
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
        ctx.globalAlpha = f.opacity; ctx.fillStyle = f.color;
        if (f.type === 'heart') drawHeart(ctx, 0, 0, f.size * 0.35);
        else if (f.type === 'star') drawStar4(ctx, 0, 0, f.size * 0.35);
        else if (f.type === 'petal') drawPetal(ctx, 0, 0, f.size * 0.5);
        else drawFlower(ctx, 0, 0, f.size * 0.3, f.color);
        ctx.restore();
      });
      ctx.globalAlpha = 1;

      // ── pulse ring around egg (inviting to tap) ──
      if (stage < TOTAL) {
        a.pulsePhase += 0.025;
        const pulseR = Math.max(eggW, eggH) * 0.7;
        for (let ring = 0; ring < 2; ring++) {
          const p = (a.pulsePhase + ring * 0.5) % 1;
          const ringR = pulseR * (0.8 + p * 0.6);
          const ringA = (1 - p) * 0.15;
          ctx.strokeStyle = stage >= 3 ? `rgba(255,200,100,${ringA})` : `rgba(220,160,255,${ringA})`;
          ctx.lineWidth = 1.5 * (1 - p);
          ctx.beginPath(); ctx.ellipse(cx, cy, ringR, ringR * 0.85, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // ── egg halo (larger, more dramatic) ──
      const haloI = 0.1 + stage * 0.07;
      const haloR = Math.max(eggW, eggH) * (1.3 + stage * 0.2);
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
      halo.addColorStop(0, `rgba(${stage >= 3 ? '255,180,80' : '220,160,255'},${haloI})`);
      halo.addColorStop(0.5, `rgba(${stage >= 3 ? '255,140,60' : '180,120,220'},${haloI * 0.3})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.ellipse(cx, cy, haloR, haloR * 0.9, 0, 0, Math.PI * 2); ctx.fill();

      // ── ground shadow ──
      const floatY = Math.sin(t * 1.3) * 3;
      const shadowScale = 1 - floatY * 0.01;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(cx, cy + eggH * 0.65, eggW * 0.45 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2); ctx.fill();

      // ── shake transform ──
      const shakeElapsed = (now - a.shakeT) / 1000;
      let sx = 0, sy = 0;
      if (shakeElapsed < 0.4) {
        const str = (1 - shakeElapsed / 0.4) * (2.5 + stage * 2);
        sx = Math.sin(now * 0.035) * str;
        sy = Math.cos(now * 0.03) * str * 0.6;
      }

      // ── egg sprite with 3D-like rotating specular ──
      const eggPad = 24;
      const eggSpriteW = eggW + eggPad * 2;
      const eggSpriteH = eggH + eggPad * 2;
      const eggX = cx - eggSpriteW / 2;
      const eggY = cy - eggSpriteH / 2;

      if (stage < TOTAL && eggSprite) {
        ctx.save();
        ctx.translate(sx, sy + floatY);
        ctx.drawImage(eggSprite, 0, 0, eggSprite.width, eggSprite.height, eggX, eggY, eggSpriteW, eggSpriteH);

        // rotating specular highlight (fake 3D rotation)
        a.specularAngle += 0.008;
        const spX = cx + Math.cos(a.specularAngle) * eggW * 0.2;
        const spY = cy - eggH * 0.15 + Math.sin(a.specularAngle * 0.7) * eggH * 0.08;
        const specGrad = ctx.createRadialGradient(spX, spY, 0, spX, spY, eggW * 0.3);
        specGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
        specGrad.addColorStop(0.4, 'rgba(255,255,255,0.05)');
        specGrad.addColorStop(1, 'rgba(255,255,255,0)');
        // clip to egg shape for specular
        ctx.beginPath(); ctx.ellipse(cx, cy, eggW / 2, eggH / 2, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = specGrad;
        ctx.beginPath(); ctx.ellipse(spX, spY, eggW * 0.3, eggH * 0.25, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ── exploding egg halves ──
      if (stage >= TOTAL && eggSprite) {
        const ep = Math.min(1, (now - a.explodeT) / 2000);
        const ease = 1 - Math.pow(1 - ep, 3);
        const halfH = eggSpriteH / 2;

        // top half
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - ep * 1.5);
        ctx.translate(cx - ease * eggW * 0.8, cy - ease * eggH);
        ctx.rotate(-ease * 0.7);
        ctx.beginPath(); ctx.rect(-eggSpriteW / 2, -halfH, eggSpriteW, halfH); ctx.clip();
        ctx.drawImage(eggSprite, 0, 0, eggSprite.width, eggSprite.height, -eggSpriteW / 2, -eggSpriteH / 2, eggSpriteW, eggSpriteH);
        ctx.restore();

        // bottom half
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - ep * 1.5);
        ctx.translate(cx + ease * eggW * 0.7, cy + ease * eggH * 0.9);
        ctx.rotate(ease * 0.6);
        ctx.beginPath(); ctx.rect(-eggSpriteW / 2, 0, eggSpriteW, halfH); ctx.clip();
        ctx.drawImage(eggSprite, 0, 0, eggSprite.width, eggSprite.height, -eggSpriteW / 2, -eggSpriteH / 2, eggSpriteW, eggSpriteH);
        ctx.restore();

        // golden orb burst
        if (ep < 0.6) {
          const orbR = eggW * 0.5 * (1 - ep);
          const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR);
          orb.addColorStop(0, `rgba(255,240,150,${0.9 * (1 - ep * 1.5)})`);
          orb.addColorStop(0.3, `rgba(255,200,80,${0.6 * (1 - ep * 1.5)})`);
          orb.addColorStop(1, 'rgba(255,180,60,0)');
          ctx.fillStyle = orb;
          ctx.fillRect(cx - orbR, cy - orbR, orbR * 2, orbR * 2);
        }

        // light beam shooting up
        if (ep < 0.8) {
          const beamA = (1 - ep) * 0.4;
          const beamW = eggW * 0.15 * (1 - ep * 0.5);
          const beamGrad = ctx.createLinearGradient(cx, cy, cx, 0);
          beamGrad.addColorStop(0, `rgba(255,220,100,${beamA})`);
          beamGrad.addColorStop(0.5, `rgba(255,200,80,${beamA * 0.3})`);
          beamGrad.addColorStop(1, 'rgba(255,180,60,0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(cx - beamW, cy); ctx.lineTo(cx - beamW * 3, 0);
          ctx.lineTo(cx + beamW * 3, 0); ctx.lineTo(cx + beamW, cy);
          ctx.closePath(); ctx.fill();
        }
      }

      // ── cracks with bezier curves + golden light bleeding ──
      if (stage > 0 && stage < TOTAL) {
        const rx = eggW / 2, ry = eggH / 2;
        ctx.save();
        ctx.translate(sx, sy + floatY);

        // light bleeding through cracks (draw BEFORE crack lines)
        for (let ci = 0; ci < Math.min(stage, CRACKS.length); ci++) {
          const crack = CRACKS[ci];
          const glowWidth = 6 + stage * 2;
          ctx.strokeStyle = `rgba(255,200,80,${0.08 + stage * 0.04})`;
          ctx.lineWidth = glowWidth;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.filter = `blur(${3 + stage}px)`;
          ctx.beginPath();
          ctx.moveTo(cx + (crack.startX - 0.5) * rx * 2, cy + (crack.startY - 0.5) * ry * 2);
          crack.segments.forEach(s => {
            ctx.bezierCurveTo(
              cx + (s.cp1x - 0.5) * rx * 2, cy + (s.cp1y - 0.5) * ry * 2,
              cx + (s.cp2x - 0.5) * rx * 2, cy + (s.cp2y - 0.5) * ry * 2,
              cx + (s.ex - 0.5) * rx * 2, cy + (s.ey - 0.5) * ry * 2,
            );
          });
          ctx.stroke();
        }
        ctx.filter = 'none';

        // actual crack lines
        for (let ci = 0; ci < Math.min(stage, CRACKS.length); ci++) {
          const crack = CRACKS[ci];
          const isNewest = ci === stage - 1;
          ctx.shadowColor = isNewest ? '#ffa500' : '#cc8800';
          ctx.shadowBlur = isNewest ? 6 : 3;
          ctx.strokeStyle = ['#d4a800', '#e08a10', '#e06018', '#d03020'][ci] || '#d03020';
          ctx.lineWidth = isNewest ? 2.4 : 1.8;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(cx + (crack.startX - 0.5) * rx * 2, cy + (crack.startY - 0.5) * ry * 2);
          crack.segments.forEach(s => {
            ctx.bezierCurveTo(
              cx + (s.cp1x - 0.5) * rx * 2, cy + (s.cp1y - 0.5) * ry * 2,
              cx + (s.cp2x - 0.5) * rx * 2, cy + (s.cp2y - 0.5) * ry * 2,
              cx + (s.ex - 0.5) * rx * 2, cy + (s.ey - 0.5) * ry * 2,
            );
          });
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── inner glow pulsing through cracks ──
      if (stage > 0 && stage < TOTAL) {
        const glowI = 0.06 + stage * 0.05 + Math.sin(t * 3) * 0.03;
        const gr = Math.max(eggW, eggH) * 0.55;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
        g.addColorStop(0, `rgba(255,200,80,${glowI})`);
        g.addColorStop(0.6, `rgba(255,160,60,${glowI * 0.3})`);
        g.addColorStop(1, 'rgba(255,180,60,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - gr, cy - gr, gr * 2, gr * 2);
      }

      // ── shell fragments ──
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.x += s.vx; s.y += s.vy; s.vy += s.gravity; s.vx *= 0.99;
        s.rot += s.rotV; s.life -= 0.008;
        if (s.life <= 0 || s.y > H + 20) { shells.splice(i, 1); continue; }
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
        ctx.globalAlpha = Math.min(1, s.life * 2);
        // draw as irregular polygon (shell-like)
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(-s.size * 0.5, -s.size * 0.3);
        ctx.lineTo(s.size * 0.3, -s.size * 0.5);
        ctx.lineTo(s.size * 0.5, s.size * 0.2);
        ctx.lineTo(-s.size * 0.2, s.size * 0.4);
        ctx.closePath(); ctx.fill();
        // subtle highlight on fragment
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(-s.size * 0.1, -s.size * 0.1, s.size * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ── particles ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= 0.994;
        p.life -= p.decay; p.rot += p.rotV;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = p.color;
        if (p.type === 'heart') { ctx.scale(0.4, 0.4); drawHeart(ctx, 0, -p.size, p.size); }
        else if (p.type === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        else if (p.type === 'petal') drawPetal(ctx, 0, 0, p.size);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ── bunny ──
      if (stage < TOTAL || (now - a.explodeT) < 2500) {
        a.bunnyPhase += 0.04;
        const hopY = Math.abs(Math.sin(a.bunnyPhase * 0.7)) * 10;
        const squash = 1 - Math.abs(Math.sin(a.bunnyPhase * 0.7)) * 0.04;
        a.earAngle = Math.sin(a.bunnyPhase * 0.7 + 0.3) * 0.1;
        const bunnyScale = Math.min(W, H) * 0.0016 + 0.32;
        const bx = W / 2, by = H - 28 - hopY;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(1 + (1 - squash) * 0.3, squash);
        ctx.translate(-bx, -by);
        const bunnyAlpha = stage >= TOTAL ? Math.max(0, 1 - (now - a.explodeT) / 2000) : 1;
        ctx.globalAlpha = bunnyAlpha;
        const lookUp = stage >= 3 || (shakeElapsed < 0.5 && stage > 0);
        drawBunny(ctx, bx, by, bunnyScale, a.earAngle, lookUp);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // ── grass strip ──
      const grassH = 16;
      const grassG = ctx.createLinearGradient(0, H - grassH, 0, H);
      grassG.addColorStop(0, 'rgba(50,140,40,0)');
      grassG.addColorStop(0.4, 'rgba(50,140,40,0.12)');
      grassG.addColorStop(1, 'rgba(40,110,30,0.25)');
      ctx.fillStyle = grassG; ctx.fillRect(-10, H - grassH, W + 20, grassH + 10);

      // tiny grass blades
      ctx.strokeStyle = 'rgba(60,160,50,0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 8 + Math.random() * 4) {
        const h = 4 + Math.random() * 6;
        const sway = Math.sin(t * 0.8 + x * 0.05) * 2;
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.quadraticCurveTo(x + sway, H - h * 0.6, x + sway * 1.5, H - h);
        ctx.stroke();
      }

      ctx.restore(); // undo screen shake

      // ── white flash on tap (drawn outside screen shake) ──
      const flashEl = (now - a.flashT) / 1000;
      if (flashEl < 0.15 && flashEl >= 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const flashA = (1 - flashEl / 0.15) * (stage >= TOTAL ? 0.7 : 0.25);
        ctx.fillStyle = `rgba(255,255,255,${flashA})`;
        ctx.fillRect(0, 0, W, H);
      }

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

      {/* UI overlay — message */}
      <AnimatePresence mode="wait">
        {stage < TOTAL && (
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: '5%', left: 0, right: 0, textAlign: 'center',
              color: 'rgba(255,220,240,0.95)', fontSize: 'clamp(12px, 3.8vw, 19px)',
              fontFamily: "'Dancing Script', cursive", fontWeight: 700,
              textShadow: '0 2px 16px rgba(200,80,255,0.6), 0 0 30px rgba(180,60,220,0.3)',
              padding: '0 14px', zIndex: 10, pointerEvents: 'none',
            }}
          >
            {MSGS[stage]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* progress dots */}
      {stage < TOTAL && (
        <div style={{
          position: 'absolute', bottom: '9%', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 8, zIndex: 10, pointerEvents: 'none',
        }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === stage - 1 ? [1, 1.5, 1.1] : 1,
                backgroundColor: i < stage ? '#ff6b9d' : 'rgba(255,255,255,0.12)',
                boxShadow: i < stage ? '0 0 8px rgba(255,107,157,0.6)' : '0 0 0px transparent',
              }}
              transition={{ duration: 0.35 }}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      )}

      {/* Easter label — stage 0 */}
      <AnimatePresence>
        {stage === 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.5, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            style={{
              position: 'absolute', bottom: '14%', left: 0, right: 0, textAlign: 'center',
              color: 'rgba(255,200,230,0.5)', fontSize: 10, letterSpacing: 2,
              fontWeight: 600, pointerEvents: 'none', zIndex: 10,
              textTransform: 'uppercase',
            }}
          >
            Surpresa de Pascoa
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
