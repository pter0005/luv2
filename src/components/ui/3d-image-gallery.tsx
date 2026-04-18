"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext, useCallback } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import Image from 'next/image'

const DATE_LOCALE = ptBR;

type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date?: Date | { seconds: number; _seconds?: number }
}

function parseDateObj(date: Card['date']) {
  if (!date) return null
  const d = date as any
  const seconds = d._seconds ?? d.seconds
  if (seconds) return new Date(seconds * 1000)
  return date instanceof Date ? date : null
}

const CardContext = createContext<{ cards: Card[] } | undefined>(undefined)

function useCardContext() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("useCardContext must be used within CardProvider")
  return ctx
}

function CardProvider({ children, events }: { children: React.ReactNode; events: Card[] }) {
  const value = useMemo(() => ({ cards: events }), [events])
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

/* ─────────────────────────────────────────────────────────────────────────────
   FULL SCREEN CARD VIEW (shared desktop + mobile)
───────────────────────────────────────────────────────────────────────────── */
function FullScreenCardView({ card, onClose }: { card: Card; onClose: () => void }) {
  const dateObj = useMemo(() => parseDateObj(card.date), [card.date])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative max-w-lg w-full max-h-[90vh] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl">
          <Image src={card.imageUrl} alt={card.alt} fill className="object-contain" sizes="(max-width: 640px) 95vw, 512px" priority />
        </div>
        <div
          className="text-center text-white p-4 rounded-xl"
          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}
        >
          <h2 className="text-xl font-bold leading-snug">{card.title}</h2>
          {dateObj && (
            <p className="text-purple-400 font-semibold text-sm mt-1">
              {format(dateObj, "PPP", { locale: DATE_LOCALE })}
            </p>
          )}
        </div>
      </motion.div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all hover:scale-110 active:scale-90 border border-white/10"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>,
    document.body
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOBILE TIMELINE — grade 2D simples, sem WebGL
   Substitui a galáxia 3D no mobile para eliminar lag e tela em branco.
───────────────────────────────────────────────────────────────────────────── */
function MobileTimeline({ events, onClose }: { events: Card[]; onClose: () => void }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!mounted) return null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[99999] bg-[#020202] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/90 to-transparent shrink-0">
        <div className="text-white pl-1">
          <h1 className="text-lg font-bold drop-shadow-xl tracking-wide">Nossa Linha do Tempo</h1>
          <p className="text-[10px] text-white/70">Toque para ver detalhes</p>
        </div>
        <button
          onClick={onClose}
          className="bg-white/10 active:bg-white/25 backdrop-blur-md text-white rounded-full p-3 shadow-lg active:scale-90 transition-all touch-manipulation border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-8">
        <div className="grid grid-cols-2 gap-2.5">
          {events.map((card, i) => {
            const dateObj = parseDateObj(card.date)
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.055, 0.6), duration: 0.35, ease: [0.22,1,0.36,1] }}
                onClick={() => setSelectedCard(card)}
                className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] active:scale-95 transition-transform duration-150 touch-manipulation"
                style={{ aspectRatio: '3/4', background: '#111' }}
              >
                <img
                  src={card.imageUrl}
                  alt={card.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {/* gradient overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 40%, transparent 70%)' }} />
                {/* heart shimmer top-right */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-[10px]">✦</div>
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-white font-semibold text-[11px] leading-snug line-clamp-2 drop-shadow-md">
                    {card.title}
                  </p>
                  {dateObj && (
                    <p className="text-purple-300 font-medium text-[9px] tracking-wider mt-0.5 uppercase">
                      {format(dateObj, "dd MMM yyyy", { locale: DATE_LOCALE })}
                    </p>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedCard && (
          <FullScreenCardView card={selectedCard} onClose={() => setSelectedCard(null)} />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   3D DESKTOP — galáxia WebGL (mantida para desktop)
───────────────────────────────────────────────────────────────────────────── */
const FloatingCard = React.memo(function FloatingCard({
  card,
  position,
  isMobile,
  onClick,
}: {
  card: Card
  position: { x: number; y: number; z: number }
  isMobile: boolean
  onClick: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const cardRef  = useRef<HTMLDivElement>(null)

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    groupRef.current.lookAt(camera.position);
    if (cardRef.current) {
      const dist    = camera.position.distanceTo(groupRef.current.position);
      const maxDist = isMobile ? 28 : 40;
      const minDist = isMobile ? 4 : 6;
      const t       = Math.max(0, Math.min(1, (dist - minDist) / (maxDist - minDist)));
      cardRef.current.style.opacity = String(1 - t * 0.82);
    }
  })

  const dateObj = useMemo(() => parseDateObj(card.date), [card.date])
  const cardW   = isMobile ? 140 : 220

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={isMobile ? 1.125 : 1.44}>
      <Html transform distanceFactor={8} zIndexRange={[16777271, 0]} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
        <div
          ref={cardRef}
          onClick={onClick}
          className="relative rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 transition-transform duration-200 hover:scale-105"
          style={{ width: `${cardW}px`, aspectRatio: '3/4' }}
        >
          <img
            src={card.imageUrl}
            alt={card.alt}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget
              if (!img.dataset.retried) {
                img.dataset.retried = '1'
                setTimeout(() => { img.src = card.imageUrl }, 2000)
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col justify-end p-4">
            <p className="text-white font-bold text-lg leading-tight drop-shadow-lg" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {card.title.length > 55 ? card.title.slice(0, 55) + '…' : card.title}
            </p>
            {card.title.length > 55 && (
              <p className="text-white/40 text-[9px] mt-0.5">toque para ver tudo</p>
            )}
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
FloatingCard.displayName = 'FloatingCard'

function StaticStars({ count = 500 }: { count?: number }) {
  const attr = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const radius    = 80
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random()
      const phi   = Math.acos(2 * Math.random() - 1)
      positions.set([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ], i * 3)
    }
    return new THREE.BufferAttribute(positions, 3)
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" {...attr} />
      </bufferGeometry>
      <pointsMaterial size={0.2} color="white" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

function CardGalaxy({ isMobile, setSelectedCard }: { isMobile: boolean; setSelectedCard: (card: Card) => void }) {
  const { cards } = useCardContext()

  const cardPositions = useMemo(() => {
    const n = cards.length
    if (n === 0) return []
    if (n === 1) return [{ x: 0, y: 0, z: 0 }]
    const phi        = Math.PI * (3 - Math.sqrt(5))
    const baseRadius = isMobile ? 6.7 : 11.2
    const radius     = baseRadius + Math.sqrt(n) * 0.5
    const yFactor    = isMobile ? 1.6 : 1.2
    return Array.from({ length: n }, (_, i) => {
      const y     = 1 - (i / (n - 1)) * 2
      const r     = Math.sqrt(1 - y * y)
      const theta = phi * i
      return { x: Math.cos(theta) * r * radius, y: y * radius * yFactor, z: Math.sin(theta) * r * radius }
    })
  }, [cards, isMobile])

  return (
    <group>
      {cards.map((card, i) =>
        cardPositions[i] ? (
          <FloatingCard key={card.id} card={card} position={cardPositions[i]} isMobile={isMobile} onClick={() => setSelectedCard(card)} />
        ) : null
      )}
    </group>
  )
}

function Scene({ isMobile, setSelectedCard }: { isMobile: boolean; setSelectedCard: (card: Card) => void }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 0, isMobile ? 22 : 32)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = isMobile ? 75 : 55
      camera.updateProjectionMatrix()
    }
  }, [isMobile, camera])

  return (
    <>
      <color attach="background" args={['#020202']} />
      <StaticStars count={isMobile ? 300 : 800} />
      <ambientLight intensity={1.5} />
      <pointLight position={[15, 15, 15]} intensity={1} color="#7000ff" />
      <CardGalaxy isMobile={isMobile} setSelectedCard={setSelectedCard} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.07} enablePan={false} minDistance={5} maxDistance={45} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

const TimelineUI = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none h-24">
    <div className="text-white pointer-events-none pl-1">
      <h1 className="text-lg font-bold drop-shadow-xl tracking-wide">Nossa Linha do Tempo</h1>
      <p className="text-[10px] text-white/70">Toque e arraste para girar</p>
    </div>
    <button
      onClick={onClose}
      className="pointer-events-auto bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md text-white rounded-full p-3 shadow-lg active:scale-90 transition-all touch-manipulation border border-white/10"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
)

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN WRAPPER
───────────────────────────────────────────────────────────────────────────── */
export default function StellarCardGallerySingle({ events, onClose }: { events: Card[]; onClose: () => void }) {
  const isMobile                          = useIsMobile()
  const [mounted, setMounted]             = useState(false)
  const [selectedCard, setSelectedCard]   = useState<Card | null>(null)
  const [webglFailed, setWebglFailed]     = useState(false)

  const handleSelectCard = useCallback((card: Card) => setSelectedCard(card), [])

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!mounted || events.length === 0) return null

  // Mobile: grade 2D sem WebGL
  if (isMobile) {
    return <MobileTimeline events={events} onClose={onClose} />
  }

  // Desktop: galáxia 3D
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[99999] bg-[#020202]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CardProvider events={events}>
        <Canvas
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          gl={{
            antialias: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
          onCreated={() => setWebglFailed(false)}
        >
          <Suspense fallback={null}>
            <Scene isMobile={false} setSelectedCard={handleSelectCard} />
          </Suspense>
        </Canvas>

        <TimelineUI onClose={onClose} />

        <AnimatePresence>
          {selectedCard && (
            <FullScreenCardView card={selectedCard} onClose={() => setSelectedCard(null)} />
          )}
        </AnimatePresence>
      </CardProvider>
    </motion.div>,
    document.body
  )
}
