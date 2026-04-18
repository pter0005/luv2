"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { FullScreenCardView, type Card, parseDateObj } from "./timeline-mobile"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

/* ─── Helpers ────────────────────────────────────────────────────── */
const easeOutBack = (t: number) => {
  const c1 = 1.55, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function createRoundedPlane(w: number, h: number, r: number): THREE.ShapeGeometry {
  const hw = w / 2, hh = h / 2
  const s  = new THREE.Shape()
  s.moveTo(-hw + r, -hh)
  s.lineTo( hw - r, -hh)
  s.quadraticCurveTo( hw, -hh,  hw, -hh + r)
  s.lineTo( hw,  hh - r)
  s.quadraticCurveTo( hw,  hh,  hw - r,  hh)
  s.lineTo(-hw + r,  hh)
  s.quadraticCurveTo(-hw,  hh, -hw,  hh - r)
  s.lineTo(-hw, -hh + r)
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh)
  return new THREE.ShapeGeometry(s, 6)
}

// Gradient overlay texture — canvas only (no image, no CORS)
function makeGradientTex(): THREE.CanvasTexture {
  const cv = document.createElement("canvas")
  cv.width = 4; cv.height = 256
  const ctx = cv.getContext("2d")!
  const g   = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0.0,  "rgba(0,0,0,0)")
  g.addColorStop(0.38, "rgba(0,0,0,0)")
  g.addColorStop(1.0,  "rgba(0,0,0,0.92)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(cv)
  t.needsUpdate = true
  return t
}

// Shared gradient texture (created once per canvas mount)
let _gradTex: THREE.CanvasTexture | null = null
function getGradTex() {
  if (!_gradTex) _gradTex = makeGradientTex()
  return _gradTex
}

/* ─── Galaxy positions ───────────────────────────────────────────── */
function useCardPositions(cards: Card[], isMobile: boolean) {
  return useMemo(() => {
    const n = cards.length
    if (n === 0) return []
    if (n === 1) return [{ x: 0, y: 0, z: 0 }]
    const phi    = Math.PI * (3 - Math.sqrt(5))
    const base   = isMobile ? 5.0 : 8.5
    const radius = base + Math.sqrt(n) * 0.75
    const yScale = isMobile ? 1.45 : 1.35
    return Array.from({ length: n }, (_, i) => {
      const y     = 1 - (i / (n - 1)) * 2
      const r     = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = phi * i
      return { x: Math.cos(theta) * r * radius, y: y * radius * yScale, z: Math.sin(theta) * r * radius }
    })
  }, [cards, isMobile])
}

/* ─── Single card (loaded) ───────────────────────────────────────── */
const CARD_ASPECT = 3 / 4

function GalleryCard({
  card, position, cardH, onClick, phase,
}: {
  card: Card; position: { x: number; y: number; z: number }
  cardH: number; onClick: () => void; phase: number
}) {
  const groupRef  = useRef<THREE.Group>(null)
  const imgMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const ovlMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const glwMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const phMatRef  = useRef<THREE.MeshBasicMaterial>(null)
  const entryT    = useRef(0)
  const phasePulse = useRef(Math.random() * Math.PI * 2)

  // Manual texture loading with error handling — bad URLs show placeholder instead of crashing
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [failed,  setFailed]  = useState(false)

  useEffect(() => {
    let disposed = false
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin("anonymous")
    loader.load(
      card.imageUrl,
      (tex) => {
        if (disposed) { tex.dispose(); return }
        tex.colorSpace      = THREE.SRGBColorSpace
        tex.minFilter       = THREE.LinearFilter
        tex.magFilter       = THREE.LinearFilter
        tex.generateMipmaps = false
        setTexture(tex)
      },
      undefined,
      () => { if (!disposed) setFailed(true) },
    )
    return () => {
      disposed = true
      setTexture((t) => { t?.dispose(); return null })
    }
  }, [card.imageUrl])

  useFrame(({ camera, clock }) => {
    const g = groupRef.current
    if (!g) return

    if (entryT.current < 1) {
      entryT.current = Math.min(1, entryT.current + 0.028)
      g.scale.setScalar(easeOutBack(entryT.current))
    }

    g.lookAt(camera.position)

    const dist    = camera.position.distanceTo(g.position)
    const t       = Math.max(0, Math.min(1, (dist - 10) / 48))
    const opacity = 1 - t * 0.25

    if (imgMatRef.current) imgMatRef.current.opacity = opacity
    if (ovlMatRef.current) ovlMatRef.current.opacity = opacity * 0.88
    if (phMatRef.current)  phMatRef.current.opacity  = opacity * (0.22 + 0.1 * Math.sin(clock.elapsedTime * 2 + phasePulse.current))

    if (glwMatRef.current) {
      const pulse = 0.10 + 0.06 * Math.sin(clock.elapsedTime * 1.4 + phase)
      glwMatRef.current.opacity = opacity * pulse
    }
  })

  const w       = cardH * CARD_ASPECT
  const geoImg  = useMemo(() => createRoundedPlane(w,         cardH,         0.18), [w, cardH])
  const geoOvl  = useMemo(() => createRoundedPlane(w,         cardH,         0.18), [w, cardH])
  const geoGlow = useMemo(() => createRoundedPlane(w + 0.26,  cardH + 0.26,  0.22), [w, cardH])
  const gradTex = useMemo(() => getGradTex(), [])
  const onTap   = useCallback((e: any) => { e.stopPropagation(); onClick() }, [onClick])

  const ready = texture && !failed

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Glow border */}
      <mesh geometry={geoGlow} renderOrder={0}>
        <meshBasicMaterial ref={glwMatRef} color="#a855f7" transparent depthWrite={false} />
      </mesh>

      {ready ? (
        <>
          {/* Card image */}
          <mesh geometry={geoImg} renderOrder={1} onClick={onTap}>
            <meshBasicMaterial ref={imgMatRef} map={texture!} transparent depthWrite={false} />
          </mesh>
          {/* Gradient overlay */}
          <mesh geometry={geoOvl} position={[0, 0, 0.005]} renderOrder={2} onClick={onTap}>
            <meshBasicMaterial ref={ovlMatRef} map={gradTex} transparent depthWrite={false} />
          </mesh>
        </>
      ) : (
        /* Placeholder — shown while loading OR if image failed */
        <mesh geometry={geoImg} renderOrder={1} onClick={onTap}>
          <meshBasicMaterial ref={phMatRef} color={failed ? "#2a1040" : "#1a0828"} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* ─── Stars ─────────────────────────────────────────────────────── */
function Stars({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const R = 85
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random()
      const phi   = Math.acos(2 * Math.random() - 1)
      positions.set([R * Math.sin(phi) * Math.cos(theta), R * Math.sin(phi) * Math.sin(theta), R * Math.cos(phi)], i * 3)
      const tint = Math.random()
      colors.set(tint > 0.85 ? [0.78, 0.62, 1.0] : tint > 0.7 ? [0.72, 0.82, 1.0] : [1, 1, 1], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3))
    return geo
  }, [count])

  if (count === 0) return null
  return (
    <points geometry={geometry}>
      <pointsMaterial vertexColors transparent opacity={0.6} sizeAttenuation size={0.18} depthWrite={false} />
    </points>
  )
}

/* ─── Nebula — soft center glow ─────────────────────────────────── */
function Nebula() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.045 + 0.015 * Math.sin(clock.elapsedTime * 0.4)
    }
  })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[18, 16, 16]} />
      <meshBasicMaterial color="#6d28d9" transparent side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

/* ─── Scene ─────────────────────────────────────────────────────── */
function Scene({ cards, isMobile, onSelectCard }: { cards: Card[]; isMobile: boolean; onSelectCard: (c: Card) => void }) {
  const { camera } = useThree()
  const positions  = useCardPositions(cards, isMobile)
  const phases     = useMemo(() => cards.map(() => Math.random() * Math.PI * 2), [cards])

  useEffect(() => {
    camera.position.set(0, 0, isMobile ? 17 : 25)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = isMobile ? 72 : 62
      camera.updateProjectionMatrix()
    }
  }, [isMobile, camera])

  const cardH = isMobile ? 2.5 : 3.2

  return (
    <>
      <color attach="background" args={["#040208"]} />
      <fog attach="fog" color="#040208" near={isMobile ? 20 : 28} far={isMobile ? 50 : 65} />
      <Stars count={isMobile ? 180 : 650} />
      <Nebula />
      <ambientLight intensity={0.8} />
      <pointLight position={[0, 10, 5]} intensity={1.2} color="#c084fc" />
      <pointLight position={[-10, -5, -5]} intensity={0.6} color="#818cf8" />

      {cards.map((card, i) =>
        positions[i] ? (
          <GalleryCard
            key={card.id}
            card={card}
            position={positions[i]}
            cardH={cardH}
            onClick={() => onSelectCard(card)}
            phase={phases[i]}
          />
        ) : null,
      )}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={isMobile ? 0.14 : 0.07}
        enablePan={false}
        enableZoom={!isMobile}
        minDistance={isMobile ? 3 : 5}
        maxDistance={isMobile ? 30 : 40}
        autoRotate
        autoRotateSpeed={isMobile ? 0.6 : 0.35}
      />
    </>
  )
}

/* ─── Mobile detection ───────────────────────────────────────────── */
function useIsMobile() {
  const [v, set] = useState(false)
  useEffect(() => {
    const check = () =>
      set(window.innerWidth < 768 || (window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ?? false))
    check()
    window.addEventListener("resize", check, { passive: true })
    return () => window.removeEventListener("resize", check)
  }, [])
  return v
}

/* ─── Root ───────────────────────────────────────────────────────── */
export default function DesktopGallery({ events, onClose }: { events: Card[]; onClose: () => void }) {
  const isMobile                        = useIsMobile()
  const [mounted, setMounted]           = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const handleSelect                    = useCallback((c: Card) => setSelectedCard(c), [])

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  if (!mounted || events.length === 0) return null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[99999]"
      style={{ background: "#040208" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Canvas
        dpr={isMobile ? [0.75, 1] : [1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{ antialias: !isMobile, powerPreference: "high-performance", stencil: false, depth: true }}
      >
        <Scene cards={events} isMobile={isMobile} onSelectCard={handleSelect} />
      </Canvas>

      {/* Header */}
      <div className="absolute top-0 left-0 w-full px-4 pt-4 pb-20 z-10 flex justify-between items-start bg-gradient-to-b from-black/75 to-transparent pointer-events-none">
        <div className="text-white">
          <h1 className="text-lg font-bold tracking-wide drop-shadow-xl">Nossa Linha do Tempo</h1>
          <p className="text-[10px] text-white/50 mt-0.5">
            {isMobile ? "Arraste para girar · Toque para ver" : "Arraste · Scroll para zoom · Clique para ver"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="pointer-events-auto bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md text-white rounded-full p-3 active:scale-90 transition-all border border-white/10 touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {selectedCard && <FullScreenCardView card={selectedCard} onClose={() => setSelectedCard(null)} />}
      </AnimatePresence>
    </motion.div>,
    document.body,
  )
}
