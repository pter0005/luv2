'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// CRACK SVG PATHS — 4 stages of cracking
// Coords are in a 200×260 viewBox centered on the egg
// ─────────────────────────────────────────────────────────────────────────────
const CRACK_PATHS = [
  // Stage 1 — small crack near top
  'M 100 55 L 95 72 L 103 80 L 97 95',
  // Stage 2 — extends + branch right
  'M 97 95 L 90 112 L 98 120 M 103 80 L 114 92 L 109 108',
  // Stage 3 — horizontal splits form
  'M 90 112 L 76 118 L 79 130 M 109 108 L 124 114 L 120 126',
  // Stage 4 — almost fully split
  'M 76 118 L 62 126 L 68 140 M 120 126 L 136 130 L 130 145 M 98 120 L 100 145',
];

const CRACK_COLORS = ['#c8a000', '#d4880a', '#e06012', '#e83020'];

// ─────────────────────────────────────────────────────────────────────────────
// 3D EGG MESH — uses LatheGeometry for smooth egg shape
// ─────────────────────────────────────────────────────────────────────────────
function EggMesh({
  stage,
  onClick,
}: {
  stage: number;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const eggRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const topRef = useRef<THREE.Mesh>(null);
  const botRef = useRef<THREE.Mesh>(null);
  const explodeT = useRef(0);
  const shakeT = useRef(0);

  // Egg profile — asymmetric: wider bottom, narrower top (real egg shape)
  const eggGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI;
      const r = Math.sin(t) * (0.68 + 0.2 * Math.sin(t * 0.65));
      const y = -Math.cos(t) * 1.12;
      pts.push(new THREE.Vector2(Math.max(0, r), y));
    }
    return new THREE.LatheGeometry(pts, 80);
  }, []);

  // Top half of egg (for explosion)
  const topGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = (i / 40) * Math.PI;
      const r = Math.sin(t) * (0.68 + 0.2 * Math.sin(t * 0.65));
      const y = -Math.cos(t) * 1.12;
      pts.push(new THREE.Vector2(Math.max(0, r), y));
    }
    pts.push(new THREE.Vector2(0, pts[pts.length - 1].y));
    return new THREE.LatheGeometry(pts, 80);
  }, []);

  // Bottom half of egg (for explosion)
  const botGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, 0));
    for (let i = 20; i <= 40; i++) {
      const t = (i / 40) * Math.PI;
      const r = Math.sin(t) * (0.68 + 0.2 * Math.sin(t * 0.65));
      const y = -Math.cos(t) * 1.12;
      pts.push(new THREE.Vector2(Math.max(0, r), y));
    }
    return new THREE.LatheGeometry(pts, 80);
  }, []);

  // Trigger shake on stage change
  const prevStage = useRef(0);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (prevStage.current !== stage && stage > 0 && stage < 5) {
      shakeT.current = t;
      prevStage.current = stage;
    }

    if (stage < 5) {
      const g = groupRef.current;
      if (!g) return;

      // Gentle Y rotation
      g.rotation.y = t * 0.45;

      // Float up-down
      g.position.y = Math.sin(t * 1.3) * 0.07;

      // Shake after click
      const sinceShake = t - shakeT.current;
      if (sinceShake < 0.5) {
        const intensity = (1 - sinceShake / 0.5) * 0.12;
        g.position.x = Math.sin(t * 28) * intensity;
        g.position.z = Math.cos(t * 22) * intensity * 0.6;
      } else {
        g.position.x = 0;
        g.position.z = 0;
      }

      // Inner glow pulse intensity
      if (glowRef.current && stage > 0) {
        const mat = glowRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity =
          (stage - 1) * 0.55 + Math.sin(t * 3.5 + stage * 1.2) * 0.25;
        mat.opacity = Math.min(0.85, 0.3 + stage * 0.14);
      }
    } else {
      // Explosion: halves fly apart
      explodeT.current = Math.min(1, explodeT.current + 0.025);
      const p = explodeT.current;
      const ease = 1 - Math.pow(1 - p, 3);
      if (topRef.current) {
        topRef.current.position.y = ease * 3.5;
        topRef.current.rotation.z = ease * 0.6;
        topRef.current.position.x = ease * -0.8;
        topRef.current.rotation.x = ease * -0.4;
      }
      if (botRef.current) {
        botRef.current.position.y = -ease * 2.8;
        botRef.current.rotation.z = ease * -0.5;
        botRef.current.position.x = ease * 0.6;
        botRef.current.rotation.x = ease * 0.3;
      }
    }
  });

  const eggColor = stage >= 4 ? '#f8b8d0' : '#f0d0e4';
  const glowColor = stage >= 3 ? '#ff8844' : '#ffcc44';

  return (
    <group ref={groupRef} onClick={onClick}>
      {/* WHOLE EGG — visible stages 0–4 */}
      <mesh ref={eggRef} geometry={eggGeo} visible={stage < 5}>
        <meshPhysicalMaterial
          color={eggColor}
          metalness={0.05}
          roughness={0.06}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
          sheen={0.7}
          sheenColor={new THREE.Color('#ffe8f4')}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* INNER GLOW — appears from stage 1 */}
      {stage >= 1 && stage < 5 && (
        <mesh ref={glowRef} scale={0.82}>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={new THREE.Color(glowColor)}
            emissiveIntensity={0}
            transparent
            opacity={0.4}
            side={THREE.FrontSide}
          />
        </mesh>
      )}

      {/* EXPLOSION HALVES — visible from stage 5 */}
      {stage >= 5 && (
        <>
          <mesh ref={topRef} geometry={topGeo}>
            <meshPhysicalMaterial
              color="#f8b8d0"
              metalness={0.05}
              roughness={0.06}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              sheen={0.7}
              sheenColor={new THREE.Color('#ffe8f4')}
            />
          </mesh>
          <mesh ref={botRef} geometry={botGeo}>
            <meshPhysicalMaterial
              color="#f8b8d0"
              metalness={0.05}
              roughness={0.06}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              sheen={0.7}
              sheenColor={new THREE.Color('#ffe8f4')}
            />
          </mesh>
          {/* Inner glow orb that stays */}
          <mesh scale={0.5}>
            <sphereGeometry args={[0.9, 32, 32]} />
            <meshStandardMaterial
              color="#ffcc44"
              emissive={new THREE.Color('#ffaa00')}
              emissiveIntensity={3}
              transparent
              opacity={0.9}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EASTER CONFETTI — canvas 2D burst (Easter color palette)
// ─────────────────────────────────────────────────────────────────────────────
function EasterConfetti({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

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
    const cy = H * 0.42;
    const DURATION = 3.5;
    const t0 = Date.now();

    const COLORS = [
      '#ff6b9d', '#ffb347', '#a8e063', '#7ec8e3', '#c77dff',
      '#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#ffc8dd',
    ];

    const rng = (a: number, b: number) => Math.random() * (b - a) + a;

    // Confetti pieces
    const pieces = Array.from({ length: 140 }, () => {
      const angle = rng(0, Math.PI * 2);
      const speed = rng(3, 10);
      return {
        x: cx + rng(-20, 20),
        y: cy + rng(-20, 20),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rng(1, 4),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: rng(6, 14),
        h: rng(4, 9),
        rot: rng(0, Math.PI * 2),
        rotV: rng(-0.15, 0.15),
        gravity: rng(0.12, 0.22),
        type: Math.floor(rng(0, 3)), // 0=rect, 1=circle, 2=heart
      };
    });

    // Sparkle burst
    const sparks = Array.from({ length: 60 }, () => {
      const a = rng(0, Math.PI * 2);
      const spd = rng(2, 12);
      return {
        x: cx, y: cy,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 2,
        life: 1, decay: rng(0.015, 0.04),
        size: rng(2, 5),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      const s = size * 0.5;
      ctx.moveTo(x, y + s * 0.4);
      ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.4);
      ctx.bezierCurveTo(x - s, y + s * 0.8, x, y + s * 1.2, x, y + s * 1.4);
      ctx.bezierCurveTo(x, y + s * 1.2, x + s, y + s * 0.8, x + s, y + s * 0.4);
      ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.4);
      ctx.fill();
    };

    const draw = () => {
      const el = (Date.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      // Bright flash at start
      if (el < 0.3) {
        const p = el / 0.3;
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
        grd.addColorStop(0, `rgba(255,230,180,${(1 - p) * 0.7})`);
        grd.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }

      // Confetti pieces
      pieces.forEach((p) => {
        p.vx *= 0.985;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;

        const fade = el > DURATION - 0.8 ? Math.max(0, 1 - (el - (DURATION - 0.8)) / 0.8) : 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;

        if (p.type === 0) {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.type === 1) {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.scale(0.6, 0.6);
          drawHeart(ctx, 0, -p.h * 0.5, p.w * 0.7);
        }

        ctx.restore();
      });

      // Sparkles
      sparks.forEach((s) => {
        s.vx *= 0.97;
        s.vy += 0.08;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;
        if (s.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (el < DURATION) {
        frameRef.current = requestAnimationFrame(draw);
      } else {
        onDone();
      }
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUNNY — bouncing CSS animation at bottom of screen
// ─────────────────────────────────────────────────────────────────────────────
function BunnyHop() {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 z-20 pointer-events-none overflow-hidden">
      <motion.div
        animate={{ y: [0, -28, 0, -14, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.55, 0.75, 1] }}
        style={{ fontSize: 48, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}
      >
        🐇
      </motion.div>
      {/* Grass strip */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(120,200,80,0.35))',
          borderTop: '2px solid rgba(80,180,60,0.3)',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLICK RIPPLE — visual feedback on click
// ─────────────────────────────────────────────────────────────────────────────
function ClickRipple({ x, y, id }: { x: number; y: number; id: number }) {
  return (
    <motion.div
      key={id}
      initial={{ scale: 0.2, opacity: 0.7, x, y }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: '2px solid #ff9ab8',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CRACK SVG OVERLAY — 2D cracks rendered on top of the 3D canvas
// ─────────────────────────────────────────────────────────────────────────────
function CrackOverlay({ stage }: { stage: number }) {
  return (
    <svg
      viewBox="0 0 200 260"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -56%)',
        width: 260,
        height: 330,
        pointerEvents: 'none',
        zIndex: 15,
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id="crackGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="crackGlowStrong">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {CRACK_PATHS.map((d, i) => {
        const visible = stage > i;
        const isNew = stage === i + 1;
        return (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke={CRACK_COLORS[i]}
            strokeWidth={isNew ? 2.2 : 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={stage >= 3 ? 'url(#crackGlowStrong)' : 'url(#crackGlow)'}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: visible ? 1 : 0,
              opacity: visible ? (isNew ? 1 : 0.85) : 0,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INNER LIGHT LEAK — glowing rays from inside the cracks
// ─────────────────────────────────────────────────────────────────────────────
function LightLeak({ stage }: { stage: number }) {
  if (stage < 2) return null;
  const intensity = Math.min(1, (stage - 2) / 3);
  return (
    <motion.div
      animate={{ opacity: [intensity * 0.4, intensity * 0.7, intensity * 0.4] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        left: '50%',
        top: '42%',
        transform: 'translate(-50%, -50%)',
        width: 180,
        height: 240,
        borderRadius: '50%',
        background: `radial-gradient(ellipse at 50% 45%, rgba(255,200,80,${0.45 * intensity}) 0%, transparent 70%)`,
        pointerEvents: 'none',
        zIndex: 14,
        filter: 'blur(12px)',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const STAGE_MESSAGES = [
  'Toque no ovo para revelar a surpresa',
  'Hmm... algo está saindo por aí 👀',
  'Está quase abrindo! Continue...',
  'Quase lá! Mais um toque! 🔥',
  'AGORA! 💥',
];

export default function EasterPreviewPage() {
  const [stage, setStage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const rippleId = useRef(0);

  const handleClick = useCallback((e?: React.MouseEvent) => {
    if (stage >= 5 || revealed) return;

    const next = stage + 1;
    setStage(next);

    // Ripple effect
    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? window.innerHeight * 0.42;
    const id = ++rippleId.current;
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);

    // Screen shake
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 350);

    if (next === 5) {
      setTimeout(() => {
        setShowConfetti(true);
      }, 400);
    }
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
      style={{
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1152 35%, #1e0840 70%, #0d051a 100%)',
        position: 'relative',
        cursor: stage < 5 ? 'pointer' : 'default',
        fontFamily: "'Nunito', 'Poppins', sans-serif",
      }}
      onClick={stage < 5 && !revealed ? handleClick : undefined}
      className={isShaking ? 'animate-shake' : ''}
    >
      {/* Animated background particles */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(200,100,255,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,100,150,0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(100,200,255,0.04) 0%, transparent 60%)
          `,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* THREE.JS CANVAS */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[3, 3, 3]} intensity={1.2} color="#fff5ee" />
          <pointLight position={[-3, 1, 2]} intensity={0.6} color="#c8aaff" />
          <pointLight
            position={[0, 0, 1]}
            intensity={stage >= 2 ? (stage - 1) * 1.5 : 0}
            color="#ffcc44"
          />
          <Environment preset="sunset" />
          <EggMesh stage={stage} onClick={handleClick} />
        </Canvas>
      </div>

      {/* CRACK SVG OVERLAY */}
      <CrackOverlay stage={stage} />

      {/* INNER LIGHT LEAK */}
      <LightLeak stage={stage} />

      {/* CLICK RIPPLES */}
      {ripples.map((r) => (
        <ClickRipple key={r.id} id={r.id} x={r.x} y={r.y} />
      ))}

      {/* TOP TEXT — message changes per stage */}
      <AnimatePresence mode="wait">
        {stage < 5 && !revealed && (
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute',
              top: '8%',
              left: 0,
              right: 0,
              textAlign: 'center',
              zIndex: 20,
              padding: '0 24px',
            }}
          >
            <p
              style={{
                color: 'rgba(255,220,240,0.92)',
                fontSize: 'clamp(15px, 4vw, 19px)',
                fontWeight: 600,
                letterSpacing: 0.3,
                textShadow: '0 2px 16px rgba(200,100,255,0.5)',
                margin: 0,
              }}
            >
              {STAGE_MESSAGES[stage]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLICK PROGRESS DOTS */}
      {stage < 5 && !revealed && (
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            zIndex: 20,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === stage - 1 ? [1, 1.5, 1] : 1,
                backgroundColor: i < stage ? '#ff6b9d' : 'rgba(255,255,255,0.2)',
              }}
              transition={{ duration: 0.3 }}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* EASTER title / branding */}
      {stage === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{
            position: 'absolute',
            bottom: '22%',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <p
            style={{
              color: 'rgba(255,200,220,0.6)',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 2,
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            🐣 Surpresa de Páscoa
          </p>
        </motion.div>
      )}

      {/* CONFETTI BURST */}
      {showConfetti && <EasterConfetti onDone={handleConfettiDone} />}

      {/* FINAL REVEAL */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(160deg, #1a0a2e 0%, #2d1152 35%, #1e0840 70%, #0d051a 100%)',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -5, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ fontSize: 72, marginBottom: 16 }}
            >
              💝
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{
                color: '#ffe8f0',
                fontSize: 'clamp(26px, 7vw, 38px)',
                fontWeight: 800,
                margin: '0 0 12px',
                textShadow: '0 0 40px rgba(255,120,180,0.5)',
                lineHeight: 1.2,
              }}
            >
              Sua surpresa está aqui!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{
                color: 'rgba(255,200,220,0.8)',
                fontSize: 'clamp(14px, 3.5vw, 17px)',
                margin: '0 0 36px',
                maxWidth: 320,
                lineHeight: 1.6,
              }}
            >
              Alguém especial preparou algo único só para você nessa Páscoa 🐣
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}
            >
              <button
                style={{
                  background: 'linear-gradient(135deg, #ff6b9d, #ff8c42)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 16,
                  padding: '16px 32px',
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(255,80,130,0.4)',
                  letterSpacing: 0.3,
                }}
              >
                Ver minha surpresa 💖
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,200,220,0.7)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                ↺ Repetir animação (admin)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BUNNY at the bottom */}
      {!revealed && <BunnyHop />}

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          15% { transform: translate(-4px,2px) rotate(-1.5deg); }
          30% { transform: translate(4px,-2px) rotate(1.5deg); }
          45% { transform: translate(-3px,3px) rotate(-1deg); }
          60% { transform: translate(3px,-1px) rotate(1deg); }
          75% { transform: translate(-2px,1px) rotate(-0.5deg); }
        }
        .animate-shake { animation: shake 0.35s ease; }
      `}</style>
    </div>
  );
}
