'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Dancing_Script, Nunito } from 'next/font/google';

// ─── FONTS ───────────────────────────────────────────────────────────────────
const fontScript = Dancing_Script({ subsets: ['latin'], weight: ['700'] });
const fontBody = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TOTAL_CLICKS = 5;

const MESSAGES = [
  'Toque no ovo para revelar',
  'Hmm... tem algo aí dentro 👀',
  'Continue quebrando!',
  'Quase lá... mais um pouco!',
  'AGORA! Último toque! 💥',
];

// ─── CRACK SVG PATHS — positioned over egg center ───────────────────────────
const CRACK_PATHS = [
  'M 50 15 L 46 28 L 52 34 L 47 48',
  'M 47 48 L 40 62 L 48 68 M 52 34 L 60 46 L 55 60',
  'M 40 62 L 30 70 L 34 80 M 55 60 L 68 66 L 64 76',
  'M 30 70 L 20 78 L 26 90 M 64 76 L 76 80 L 70 92 M 48 68 L 50 88',
];

// ═══════════════════════════════════════════════════════════════════════════════
// 3D EGG — LatheGeometry with canvas-painted Easter texture
// ═══════════════════════════════════════════════════════════════════════════════
function useEggTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d')!;

    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#f8d0e8');
    grad.addColorStop(0.5, '#f0b8d4');
    grad.addColorStop(1, '#e8a0c0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Decorative zigzag stripes
    ctx.strokeStyle = '#d890b8';
    ctx.lineWidth = 4;
    for (const baseY of [140, 370]) {
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        ctx.lineTo(x, baseY + Math.sin(x * 0.06) * 12);
      }
      ctx.stroke();
    }

    // Wavy middle band
    ctx.fillStyle = 'rgba(255,200,220,0.4)';
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 4) ctx.lineTo(x, 220 + Math.sin(x * 0.04) * 10);
    for (let x = 512; x >= 0; x -= 4) ctx.lineTo(x, 290 + Math.sin(x * 0.04) * 10);
    ctx.closePath();
    ctx.fill();

    // Hearts scattered
    const drawHeart = (hx: number, hy: number, s: number, color: string) => {
      ctx.save(); ctx.translate(hx, hy); ctx.scale(s / 28, s / 28);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(-12, -22, -28, -2, 0, 18);
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(12, -22, 28, -2, 0, 18);
      ctx.fill();
      ctx.restore();
    };
    drawHeart(90, 255, 22, '#ff6b8a');
    drawHeart(320, 255, 18, '#ff8fab');
    drawHeart(420, 260, 14, '#ffb3c6');
    drawHeart(200, 250, 26, '#ff4d7a');
    drawHeart(480, 255, 16, '#ff6b8a');

    // Golden dots
    ctx.fillStyle = '#ffd700';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small flowers
    const drawFlower = (fx: number, fy: number, s: number) => {
      ctx.fillStyle = '#ffe066';
      for (let a = 0; a < 5; a++) {
        const angle = (a / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(fx + Math.cos(angle) * s * 0.5, fy + Math.sin(angle) * s * 0.5, s * 0.35, s * 0.2, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.arc(fx, fy, s * 0.2, 0, Math.PI * 2); ctx.fill();
    };
    drawFlower(150, 170, 14);
    drawFlower(380, 400, 12);
    drawFlower(60, 390, 10);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }, []);
}

function EggMesh({ stage, onClick }: { stage: number; onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const topRef = useRef<THREE.Mesh>(null);
  const botRef = useRef<THREE.Mesh>(null);
  const shakeStart = useRef(-10);
  const prevStage = useRef(0);
  const explodeT = useRef(0);
  const texture = useEggTexture();

  const eggGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI;
      const r = Math.sin(t) * (0.66 + 0.22 * Math.sin(t * 0.6));
      pts.push(new THREE.Vector2(Math.max(0.001, r), -Math.cos(t) * 1.12));
    }
    return new THREE.LatheGeometry(pts, 80);
  }, []);

  const topGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = (i / 48) * Math.PI;
      const r = Math.sin(t) * (0.66 + 0.22 * Math.sin(t * 0.6));
      pts.push(new THREE.Vector2(Math.max(0.001, r), -Math.cos(t) * 1.12));
    }
    pts.push(new THREE.Vector2(0.001, pts[pts.length - 1].y));
    return new THREE.LatheGeometry(pts, 80);
  }, []);

  const botGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [new THREE.Vector2(0.001, 0)];
    for (let i = 24; i <= 48; i++) {
      const t = (i / 48) * Math.PI;
      const r = Math.sin(t) * (0.66 + 0.22 * Math.sin(t * 0.6));
      pts.push(new THREE.Vector2(Math.max(0.001, r), -Math.cos(t) * 1.12));
    }
    return new THREE.LatheGeometry(pts, 80);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;

    if (stage !== prevStage.current && stage > 0 && stage < 5) {
      shakeStart.current = t;
      prevStage.current = stage;
    }

    if (stage < 5) {
      // Rotation slows with each crack
      const rotSpeed = Math.max(0.05, 0.4 - stage * 0.09);
      g.rotation.y = t * rotSpeed;
      g.position.y = Math.sin(t * 1.2) * 0.06;

      // Shake after click
      const since = t - shakeStart.current;
      if (since < 0.45) {
        const str = (1 - since / 0.45) * (0.06 + stage * 0.03);
        g.position.x = Math.sin(t * 30) * str;
        g.position.z = Math.cos(t * 25) * str * 0.5;
      } else {
        g.position.x *= 0.9;
        g.position.z *= 0.9;
      }

      // Inner glow
      if (glowRef.current && stage > 0) {
        const mat = glowRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = (stage - 1) * 0.5 + Math.sin(t * 3 + stage) * 0.2;
        mat.opacity = Math.min(0.85, 0.25 + stage * 0.15);
      }
    } else {
      // Explosion
      explodeT.current = Math.min(1, explodeT.current + 0.02);
      const p = 1 - Math.pow(1 - explodeT.current, 3);
      if (topRef.current) {
        topRef.current.position.y = p * 4;
        topRef.current.rotation.z = p * 0.7;
        topRef.current.rotation.x = p * -0.5;
        topRef.current.position.x = p * -1;
      }
      if (botRef.current) {
        botRef.current.position.y = -p * 3;
        botRef.current.rotation.z = -p * 0.6;
        botRef.current.rotation.x = p * 0.4;
        botRef.current.position.x = p * 0.8;
      }
    }
  });

  const matProps = {
    metalness: 0.04,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    sheen: 0.8,
    sheenColor: new THREE.Color('#ffe8f4'),
    envMapIntensity: 1.4,
    ...(texture ? { map: texture } : { color: '#f0c8d8' }),
  };

  return (
    <group ref={groupRef} onClick={onClick}>
      {/* Whole egg */}
      <mesh geometry={eggGeo} visible={stage < 5}>
        <meshPhysicalMaterial {...matProps} />
      </mesh>

      {/* Inner glow */}
      {stage >= 1 && stage < 5 && (
        <mesh ref={glowRef} scale={0.78}>
          <sphereGeometry args={[0.92, 32, 32]} />
          <meshStandardMaterial
            color={stage >= 3 ? '#ff8844' : '#ffcc44'}
            emissive={new THREE.Color(stage >= 3 ? '#ff6600' : '#ffaa00')}
            emissiveIntensity={0}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Explosion halves */}
      {stage >= 5 && (
        <>
          <mesh ref={topRef} geometry={topGeo}>
            <meshPhysicalMaterial {...matProps} />
          </mesh>
          <mesh ref={botRef} geometry={botGeo}>
            <meshPhysicalMaterial {...matProps} />
          </mesh>
          <mesh scale={0.45}>
            <sphereGeometry args={[0.9, 32, 32]} />
            <meshStandardMaterial color="#ffcc44" emissive="#ffaa00" emissiveIntensity={4} transparent opacity={0.9} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG BUNNY — hand-drawn cute rabbit with animations
// ═══════════════════════════════════════════════════════════════════════════════
function BunnySVG() {
  return (
    <motion.div
      style={{ position: 'fixed', bottom: 10, left: '50%', zIndex: 20, width: 90, height: 115, pointerEvents: 'none' }}
      animate={{ y: [0, -32, 0, -16, 0], x: '-50%', scaleY: [1, 1.08, 0.94, 1.04, 1], scaleX: [1, 0.94, 1.06, 0.97, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.28, 0.52, 0.75, 1] }}
    >
      <svg viewBox="0 0 120 150" width="100%" height="100%">
        {/* Shadow */}
        <ellipse cx="60" cy="142" rx="24" ry="5" fill="rgba(0,0,0,0.12)" />

        {/* Left ear */}
        <motion.g
          animate={{ rotate: [-3, 4, -3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
          style={{ transformOrigin: '44px 50px' }}
        >
          <ellipse cx="40" cy="22" rx="11" ry="28" fill="#f5e0d0" stroke="#e0c8b4" strokeWidth="0.8" />
          <ellipse cx="40" cy="24" rx="6.5" ry="21" fill="#ffc0d0" />
        </motion.g>

        {/* Right ear */}
        <motion.g
          animate={{ rotate: [3, -4, 3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
          style={{ transformOrigin: '76px 50px' }}
        >
          <ellipse cx="80" cy="22" rx="11" ry="28" fill="#f5e0d0" stroke="#e0c8b4" strokeWidth="0.8" />
          <ellipse cx="80" cy="24" rx="6.5" ry="21" fill="#ffc0d0" />
        </motion.g>

        {/* Body */}
        <ellipse cx="60" cy="102" rx="30" ry="32" fill="#f5e0d0" stroke="#e0c8b4" strokeWidth="0.6" />
        {/* Belly */}
        <ellipse cx="60" cy="104" rx="20" ry="22" fill="#faf2ec" opacity="0.6" />

        {/* Head */}
        <circle cx="60" cy="60" r="24" fill="#f5e0d0" stroke="#e0c8b4" strokeWidth="0.6" />

        {/* Eyes */}
        <ellipse cx="50" cy="56" rx="3.8" ry="4.5" fill="#2d1b10" />
        <ellipse cx="70" cy="56" rx="3.8" ry="4.5" fill="#2d1b10" />
        {/* Eye shine */}
        <circle cx="51.5" cy="54" r="1.6" fill="white" />
        <circle cx="71.5" cy="54" r="1.6" fill="white" />
        <circle cx="49" cy="57" r="0.8" fill="rgba(255,255,255,0.5)" />
        <circle cx="69" cy="57" r="0.8" fill="rgba(255,255,255,0.5)" />

        {/* Nose */}
        <motion.ellipse
          cx="60" cy="64" rx="3.5" ry="2.5" fill="#ffaabb"
          animate={{ rx: [3.5, 4, 3.5], ry: [2.5, 2.2, 2.5] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />

        {/* Mouth */}
        <path d="M 55 67 Q 60 72 65 67" fill="none" stroke="#d4a08a" strokeWidth="1.3" strokeLinecap="round" />

        {/* Whiskers */}
        <g opacity="0.35" stroke="#c4a090" strokeWidth="0.7" strokeLinecap="round">
          <line x1="30" y1="60" x2="47" y2="63" />
          <line x1="30" y1="66" x2="47" y2="66" />
          <line x1="73" y1="63" x2="90" y2="60" />
          <line x1="73" y1="66" x2="90" y2="66" />
        </g>

        {/* Rosy cheeks */}
        <circle cx="38" cy="63" r="5.5" fill="rgba(255,150,180,0.3)" />
        <circle cx="82" cy="63" r="5.5" fill="rgba(255,150,180,0.3)" />

        {/* Tail — fluffy cotton */}
        <motion.g
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          style={{ transformOrigin: '92px 95px' }}
        >
          <circle cx="92" cy="95" r="9" fill="white" />
          <circle cx="95" cy="91" r="6" fill="white" />
          <circle cx="89" cy="90" r="5" fill="white" />
        </motion.g>

        {/* Front paws */}
        <ellipse cx="42" cy="128" rx="10" ry="6.5" fill="#f5e0d0" stroke="#e0c8b4" strokeWidth="0.5" />
        <ellipse cx="78" cy="128" rx="10" ry="6.5" fill="#f5e0d0" stroke="#e0c8b4" strokeWidth="0.5" />
        {/* Paw pads */}
        <circle cx="40" cy="129" r="2" fill="#ffc0d0" opacity="0.5" />
        <circle cx="45" cy="129" r="2" fill="#ffc0d0" opacity="0.5" />
        <circle cx="76" cy="129" r="2" fill="#ffc0d0" opacity="0.5" />
        <circle cx="81" cy="129" r="2" fill="#ffc0d0" opacity="0.5" />
      </svg>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STARFIELD — twinkling CSS stars in background
// ═══════════════════════════════════════════════════════════════════════════════
function Starfield() {
  const stars = useMemo(() =>
    Array.from({ length: 55 }, (_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      delay: Math.random() * 4,
      dur: 2 + Math.random() * 3,
    })),
  []);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${s.left}%`, top: `${s.top}%`,
          width: s.size, height: s.size, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)',
          animation: `twinkle ${s.dur}s ${s.delay}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING PARTICLES — hearts, sparkles, tiny eggs rising upward
// ═══════════════════════════════════════════════════════════════════════════════
function FloatingParticles() {
  const items = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 10,
      dur: 8 + Math.random() * 8,
      size: 10 + Math.random() * 14,
      drift: -30 + Math.random() * 60,
      type: (['heart', 'sparkle', 'dot'] as const)[i % 3],
      opacity: 0.12 + Math.random() * 0.18,
    })),
  []);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 4 }}>
      {items.map((p) => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, bottom: -40, fontSize: p.size,
          opacity: 0, color: p.type === 'heart' ? '#ff6b9d' : p.type === 'sparkle' ? '#ffd700' : '#c8aaff',
          animation: `floatUp ${p.dur}s ${p.delay}s infinite linear`,
          ['--drift' as string]: `${p.drift}px`,
          ['--maxOp' as string]: p.opacity,
        }}>
          {p.type === 'heart' ? (
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : p.type === 'sparkle' ? (
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z" />
            </svg>
          ) : (
            <svg width="1em" height="1em" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRACK SVG OVERLAY — golden cracks on top of the 3D egg
// ═══════════════════════════════════════════════════════════════════════════════
function CrackOverlay({ stage }: { stage: number }) {
  if (stage < 1 || stage >= 5) return null;
  return (
    <svg
      viewBox="0 0 100 110"
      style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -56%)',
        width: 220, height: 240,
        pointerEvents: 'none', zIndex: 15, overflow: 'visible',
      }}
    >
      <defs>
        <filter id="ckglow">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {CRACK_PATHS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={['#d4a800', '#e08a10', '#e06018', '#d03020'][i]}
          strokeWidth={stage === i + 1 ? 2.5 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#ckglow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: stage > i ? 1 : 0, opacity: stage > i ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EGG HALO — glowing aura behind the egg
// ═══════════════════════════════════════════════════════════════════════════════
function EggHalo({ stage }: { stage: number }) {
  const opacity = 0.2 + stage * 0.12;
  const size = 260 + stage * 25;
  return (
    <motion.div
      animate={{ opacity: [opacity * 0.7, opacity, opacity * 0.7], scale: [0.96, 1.04, 0.96] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute', left: '50%', top: '42%',
        transform: 'translate(-50%, -50%)',
        width: size, height: size * 1.15,
        borderRadius: '50%',
        background: stage >= 3
          ? `radial-gradient(ellipse, rgba(255,180,80,${opacity}) 0%, rgba(255,120,60,${opacity * 0.3}) 40%, transparent 70%)`
          : `radial-gradient(ellipse, rgba(255,180,220,${opacity}) 0%, rgba(200,120,255,${opacity * 0.3}) 40%, transparent 70%)`,
        filter: `blur(${18 + stage * 6}px)`,
        pointerEvents: 'none', zIndex: 8,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI BURST — canvas 2D with Easter colors + hearts + sparkles
// ═══════════════════════════════════════════════════════════════════════════════
function Confetti({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const cx = W / 2, cy = H * 0.40;
    const DUR = 4;
    const t0 = Date.now();
    const rng = (a: number, b: number) => Math.random() * (b - a) + a;

    const COLORS = ['#ff6b9d', '#ffb347', '#a8e063', '#7ec8e3', '#c77dff', '#ffd166', '#ef476f', '#06d6a0', '#ffc8dd', '#ff9ab8'];

    const pieces = Array.from({ length: 160 }, () => {
      const a = rng(0, Math.PI * 2), spd = rng(3.5, 12);
      return {
        x: cx + rng(-15, 15), y: cy + rng(-15, 15),
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - rng(2, 5),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: rng(6, 15), h: rng(4, 10),
        rot: rng(0, Math.PI * 2), rotV: rng(-0.18, 0.18),
        grav: rng(0.12, 0.24), type: Math.floor(rng(0, 3)),
      };
    });

    const sparks = Array.from({ length: 70 }, () => {
      const a = rng(0, Math.PI * 2), spd = rng(3, 14);
      return {
        x: cx, y: cy, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 3,
        life: 1, decay: rng(0.012, 0.035),
        size: rng(2, 6), color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    const drawHeart = (x: number, y: number, s: number) => {
      ctx.beginPath();
      const r = s * 0.4;
      ctx.moveTo(x, y + r * 0.4);
      ctx.bezierCurveTo(x, y, x - r, y, x - r, y + r * 0.4);
      ctx.bezierCurveTo(x - r, y + r * 0.85, x, y + r * 1.3, x, y + r * 1.5);
      ctx.bezierCurveTo(x, y + r * 1.3, x + r, y + r * 0.85, x + r, y + r * 0.4);
      ctx.bezierCurveTo(x + r, y, x, y, x, y + r * 0.4);
      ctx.fill();
    };

    const draw = () => {
      const el = (Date.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      // Flash
      if (el < 0.25) {
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250);
        grd.addColorStop(0, `rgba(255,235,180,${(1 - el / 0.25) * 0.8})`);
        grd.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      }

      const fade = el > DUR - 0.8 ? Math.max(0, 1 - (el - (DUR - 0.8)) / 0.8) : 1;

      pieces.forEach((p) => {
        p.vx *= 0.988; p.vy += p.grav;
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = fade; ctx.fillStyle = p.color;
        if (p.type === 0) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        else if (p.type === 1) { ctx.beginPath(); ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.scale(0.55, 0.55); drawHeart(0, -p.h * 0.5, p.w * 0.8); }
        ctx.restore();
      });

      sparks.forEach((s) => {
        s.vx *= 0.97; s.vy += 0.07;
        s.x += s.vx; s.y += s.vy; s.life -= s.decay;
        if (s.life <= 0) return;
        ctx.save(); ctx.globalAlpha = s.life * fade;
        ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      if (el < DUR) frameRef.current = requestAnimationFrame(draw);
      else onDone();
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [onDone]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none' }} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function EasterPreviewPage() {
  const [stage, setStage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = useCallback(() => {
    if (stage >= 5 || revealed) return;
    const next = stage + 1;
    setStage(next);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
    if (next === 5) setTimeout(() => setShowConfetti(true), 500);
  }, [stage, revealed]);

  const handleConfettiDone = useCallback(() => {
    setRevealed(true);
    setShowConfetti(false);
  }, []);

  const handleReset = useCallback(() => {
    setStage(0);
    setShowConfetti(false);
    setRevealed(false);
  }, []);

  return (
    <div
      className={fontBody.className}
      onClick={stage < 5 && !revealed ? handleClick : undefined}
      style={{
        width: '100vw', height: '100dvh', overflow: 'hidden', position: 'relative',
        cursor: stage < 5 ? 'pointer' : 'default',
        background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1152 30%, #1e0840 65%, #0d051a 100%)',
      }}
    >
      {/* Background layers */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(200,100,255,0.06) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(255,100,150,0.06) 0%, transparent 50%)`,
      }} />

      {/* Grass strip at bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 50, zIndex: 18, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 0%, rgba(50,140,40,0.25) 50%, rgba(40,120,30,0.4) 100%)',
      }} />

      <Starfield />
      <FloatingParticles />
      <EggHalo stage={stage} />

      {/* THREE.JS CANVAS */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <Canvas camera={{ position: [0, 0, 4.2], fov: 44 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
          <ambientLight intensity={0.45} />
          <pointLight position={[3, 3, 3]} intensity={1.3} color="#fff5ee" />
          <pointLight position={[-3, 1, 2]} intensity={0.6} color="#c8aaff" />
          <pointLight position={[0, 0, 1.5]} intensity={stage >= 2 ? stage * 1.2 : 0} color="#ffcc44" />
          <Environment preset="sunset" />
          <EggMesh stage={stage} onClick={handleClick} />
        </Canvas>
      </div>

      <CrackOverlay stage={stage} />

      {/* TOP TEXT */}
      <AnimatePresence mode="wait">
        {stage < 5 && !revealed && (
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35 }}
            style={{ position: 'absolute', top: '7%', left: 0, right: 0, textAlign: 'center', zIndex: 22, padding: '0 28px' }}
          >
            <p className={fontScript.className} style={{
              color: 'rgba(255,220,240,0.92)', fontSize: 'clamp(22px, 5.5vw, 30px)',
              textShadow: '0 2px 20px rgba(200,80,255,0.5)', margin: 0, lineHeight: 1.3,
            }}>
              {MESSAGES[stage]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easter title — stage 0 only */}
      <AnimatePresence>
        {stage === 0 && !revealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{ position: 'absolute', bottom: '18%', left: 0, right: 0, textAlign: 'center', zIndex: 22, pointerEvents: 'none' }}
          >
            <p className={fontScript.className} style={{
              color: 'rgba(255,200,230,0.55)', fontSize: 'clamp(14px, 3.5vw, 18px)',
              letterSpacing: 1.5, margin: 0,
            }}>
              🐣 Surpresa de Páscoa 🐣
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress dots */}
      {stage < 5 && !revealed && (
        <div style={{
          position: 'absolute', bottom: '12%', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 10, zIndex: 22,
        }}>
          {Array.from({ length: TOTAL_CLICKS }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === stage - 1 ? [1, 1.6, 1] : 1,
                backgroundColor: i < stage ? '#ff6b9d' : 'rgba(255,255,255,0.18)',
                boxShadow: i < stage ? '0 0 8px rgba(255,107,157,0.6)' : 'none',
              }}
              transition={{ duration: 0.35 }}
              style={{
                width: 11, height: 11, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </div>
      )}

      {/* Bunny */}
      {!revealed && <BunnySVG />}

      {/* Confetti */}
      {showConfetti && <Confetti onDone={handleConfettiDone} />}

      {/* REVEAL SCREEN */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1152 35%, #1e0840 70%, #0d051a 100%)',
              padding: '32px 24px', textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ fontSize: 80, marginBottom: 20, filter: 'drop-shadow(0 0 20px rgba(255,100,160,0.5))' }}
            >
              💝
            </motion.div>

            <motion.h1
              className={fontScript.className}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{
                color: '#ffe8f0', fontSize: 'clamp(30px, 8vw, 44px)', fontWeight: 700,
                margin: '0 0 14px', textShadow: '0 0 40px rgba(255,120,180,0.5)', lineHeight: 1.2,
              }}
            >
              Sua surpresa está aqui!
            </motion.h1>

            <motion.p
              className={fontBody.className}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{
                color: 'rgba(255,200,220,0.8)', fontSize: 'clamp(14px, 3.5vw, 17px)',
                margin: '0 0 40px', maxWidth: 340, lineHeight: 1.7, fontWeight: 400,
              }}
            >
              Alguém especial preparou algo único só para você nessa Páscoa
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}
            >
              <button className={fontBody.className} style={{
                background: 'linear-gradient(135deg, #ff6b9d, #ff8c42)',
                color: 'white', border: 'none', borderRadius: 16,
                padding: '17px 32px', fontSize: 17, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(255,80,130,0.45)', letterSpacing: 0.3,
              }}>
                Ver minha surpresa 💖
              </button>

              <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className={fontBody.className} style={{
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,200,220,0.6)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                padding: '12px 24px', fontSize: 13, cursor: 'pointer',
              }}>
                ↺ Repetir animação (admin)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global styles */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.08; transform: scale(0.8); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          8% { opacity: var(--maxOp); }
          85% { opacity: var(--maxOp); }
          100% { transform: translateY(-110vh) translateX(var(--drift)) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
