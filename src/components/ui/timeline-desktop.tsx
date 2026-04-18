"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext, useCallback } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import { X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { FullScreenCardView, type Card, parseDateObj } from "./timeline-mobile"

const DATE_LOCALE = ptBR

const CardContext = createContext<{ cards: Card[] } | undefined>(undefined)
function useCardContext() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("must be inside CardProvider")
  return ctx
}
function CardProvider({ children, events }: { children: React.ReactNode; events: Card[] }) {
  const value = useMemo(() => ({ cards: events }), [events])
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>
}

/* ─── Floating card ─── */
const FloatingCard = React.memo(function FloatingCard({
  card,
  position,
  onClick,
}: {
  card: Card
  position: { x: number; y: number; z: number }
  onClick: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const cardRef  = useRef<HTMLDivElement>(null)

  useFrame(({ camera }) => {
    if (!groupRef.current) return
    groupRef.current.lookAt(camera.position)
    if (cardRef.current) {
      const dist = camera.position.distanceTo(groupRef.current.position)
      const t    = Math.max(0, Math.min(1, (dist - 12) / (55 - 12)))
      cardRef.current.style.opacity = String(1 - t * 0.2)
    }
  })

  const dateObj = useMemo(() => parseDateObj(card.date), [card.date])

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={1.44}>
      <Html transform distanceFactor={8} zIndexRange={[16777271, 0]} style={{ pointerEvents: "auto", cursor: "pointer" }}>
        <div
          ref={cardRef}
          onClick={onClick}
          className="relative rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-white/10 transition-transform duration-200 hover:scale-105"
          style={{ width: "220px", aspectRatio: "3/4" }}
        >
          <img
            src={card.imageUrl}
            alt={card.alt}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget
              if (!img.dataset.retried) { img.dataset.retried = "1"; setTimeout(() => { img.src = card.imageUrl }, 2000) }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex flex-col justify-end p-4">
            <p className="text-white font-bold text-base leading-tight" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {card.title.length > 55 ? card.title.slice(0, 55) + "…" : card.title}
            </p>
            {dateObj && (
              <p className="text-purple-400 font-semibold text-xs tracking-wide mt-1">
                {format(dateObj, "dd MMM yyyy", { locale: DATE_LOCALE })}
              </p>
            )}
          </div>
        </div>
      </Html>
    </group>
  )
})
FloatingCard.displayName = "FloatingCard"

/* ─── Stars ─── */
function StaticStars() {
  const attr = useMemo(() => {
    const positions = new Float32Array(800 * 3)
    const radius    = 80
    for (let i = 0; i < 800; i++) {
      const theta = 2 * Math.PI * Math.random()
      const phi   = Math.acos(2 * Math.random() - 1)
      positions.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)], i * 3)
    }
    return new THREE.BufferAttribute(positions, 3)
  }, [])
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" {...attr} /></bufferGeometry>
      <pointsMaterial size={0.2} color="white" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

/* ─── Galaxy ─── */
function CardGalaxy({ setSelectedCard }: { setSelectedCard: (c: Card) => void }) {
  const { cards } = useCardContext()
  const cardPositions = useMemo(() => {
    const n = cards.length
    if (n === 0) return []
    if (n === 1) return [{ x: 0, y: 0, z: 0 }]
    const phi    = Math.PI * (3 - Math.sqrt(5))
    const radius = 9.0 + Math.sqrt(n) * 0.8
    return Array.from({ length: n }, (_, i) => {
      const y     = 1 - (i / (n - 1)) * 2
      const r     = Math.sqrt(1 - y * y)
      const theta = phi * i
      return { x: Math.cos(theta) * r * radius, y: y * radius * 1.4, z: Math.sin(theta) * r * radius }
    })
  }, [cards])
  return (
    <group>
      {cards.map((card, i) =>
        cardPositions[i] ? (
          <FloatingCard key={card.id} card={card} position={cardPositions[i]} onClick={() => setSelectedCard(card)} />
        ) : null,
      )}
    </group>
  )
}

/* ─── Scene ─── */
function Scene({ setSelectedCard }: { setSelectedCard: (c: Card) => void }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 0, 28)
    if (camera instanceof THREE.PerspectiveCamera) { camera.fov = 65; camera.updateProjectionMatrix() }
  }, [camera])
  return (
    <>
      <color attach="background" args={["#020202"]} />
      <StaticStars />
      <ambientLight intensity={1.5} />
      <pointLight position={[15, 15, 15]} intensity={1} color="#7000ff" />
      <CardGalaxy setSelectedCard={setSelectedCard} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.07} enablePan={false} minDistance={5} maxDistance={45} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

/* ─── Main ─── */
export default function DesktopGallery({ events, onClose }: { events: Card[]; onClose: () => void }) {
  const [mounted, setMounted]           = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const handleSelectCard                = useCallback((card: Card) => setSelectedCard(card), [])

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  if (!mounted || events.length === 0) return null

  return createPortal(
    <motion.div className="fixed inset-0 z-[99999] bg-[#020202]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <CardProvider events={events}>
        <Canvas
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          gl={{ antialias: false, powerPreference: "high-performance", stencil: false, depth: true }}
        >
          <Suspense fallback={null}>
            <Scene setSelectedCard={handleSelectCard} />
          </Suspense>
        </Canvas>

        {/* Header */}
        <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none h-24">
          <div className="text-white pointer-events-none pl-1">
            <h1 className="text-lg font-bold drop-shadow-xl tracking-wide">Nossa Linha do Tempo</h1>
            <p className="text-[10px] text-white/70">Arraste para girar · Scroll para zoom</p>
          </div>
          <button onClick={onClose} className="pointer-events-auto bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md text-white rounded-full p-3 shadow-lg active:scale-90 transition-all border border-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {selectedCard && <FullScreenCardView card={selectedCard} onClose={() => setSelectedCard(null)} />}
        </AnimatePresence>
      </CardProvider>
    </motion.div>,
    document.body,
  )
}
