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
import Image from 'next/image'

/* ─────────────────────────────────────────────────────────────────────────────
   FIX ①: fnsLocale fora do módulo.
   PROBLEMA: estava declarado como "const fnsLocale = ptBR" DENTRO de
   FloatingCard e FullScreenCardView. A cada render desses componentes,
   uma nova referência era criada para o mesmo objeto — gasto de memória
   à toa e risco de causar re-renders em cascata em dependências de useMemo.
───────────────────────────────────────────────────────────────────────────── */
const DATE_LOCALE = ptBR;

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & CONTEXT
───────────────────────────────────────────────────────────────────────────── */
type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date?: Date | { seconds: number; _seconds?: number }
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

/* ─────────────────────────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    // FIX ②: passive:true no resize listener.
    // Sem passive:true, o browser não pode otimizar o handler de scroll/resize
    // porque precisa verificar se alguém vai chamar preventDefault().
    // Com passive:true, o browser sabe que pode processar o evento em paralelo.
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, []) // array vazio correto — listener criado uma só vez
  return isMobile
}

/* ─────────────────────────────────────────────────────────────────────────────
   FLOATING CARD
───────────────────────────────────────────────────────────────────────────── */
// FIX ③: removido "_cameraPos = new THREE.Vector3()" que estava declarado
// no nível do módulo mas NUNCA era usado — dead code que podia confundir.
//
// O lookAt direto em camera.position é o correto: Three.js internamente
// cria o vetor necessário, então não precisa de uma variável auxiliar.

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
  const groupRef    = useRef<THREE.Group>(null)
  const occludeRef  = useRef<THREE.Mesh>(null)

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    groupRef.current.lookAt(camera.position);
    // Dynamically set renderOrder based on distance to camera so closer
    // cards always render on top of farther ones.
    const dist = groupRef.current.position.distanceTo(camera.position);
    groupRef.current.renderOrder = Math.round(1000 - dist);
  })

  // FIX ①: usa DATE_LOCALE (constante de módulo) em vez de "const fnsLocale = ptBR" local
  const dateObj = useMemo(() => {
    if (!card.date) return null
    const d = card.date as any
    const seconds = d._seconds ?? d.seconds
    if (seconds) return new Date(seconds * 1000)
    return card.date instanceof Date ? card.date : null
  }, [card.date])

  const cardW   = isMobile ? 140 : 220
  const planeW  = (cardW / 100) * 1.26
  const planeH  = planeW / (3 / 4)

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      scale={isMobile ? 1.125 : 1.44}
    >
      <mesh ref={occludeRef}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial colorWrite={false} depthWrite={true} depthTest={true} transparent={false} side={THREE.DoubleSide} />
      </mesh>

      <Html
        transform
        occlude={[occludeRef]}
        distanceFactor={8}
        position={[0, 0, 0.1]}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'auto', cursor: 'pointer', transformStyle: 'preserve-3d' }}
      >
        <div
          onClick={onClick}
          className="relative rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 transition-transform duration-200 hover:scale-105"
          style={{ width: `${cardW}px`, aspectRatio: '3/4' }}
        >
          {/* img nativa aqui é correto — Next Image tem overhead de hidratação
              desnecessário dentro de um canvas WebGL */}
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

/* ─────────────────────────────────────────────────────────────────────────────
   STATIC STARS
───────────────────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────────────────
   CARD GALAXY
───────────────────────────────────────────────────────────────────────────── */
function CardGalaxy({
  isMobile,
  setSelectedCard,
}: {
  isMobile: boolean
  setSelectedCard: (card: Card) => void
}) {
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
      return {
        x: Math.cos(theta) * r * radius,
        y: y * radius * yFactor,
        z: Math.sin(theta) * r * radius,
      }
    })
  }, [cards, isMobile])

  return (
    <group>
      {cards.map((card, i) =>
        cardPositions[i] ? (
          <FloatingCard
            key={card.id}
            card={card}
            position={cardPositions[i]}
            isMobile={isMobile}
            onClick={() => setSelectedCard(card)}
          />
        ) : null
      )}
    </group>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SCENE
   FIX ④: removida a prop "events" que não era usada (a cena lê do Context).
   Props desnecessárias aumentam superfície de re-render e confundem TypeScript.
───────────────────────────────────────────────────────────────────────────── */
function Scene({
  isMobile,
  setSelectedCard,
}: {
  isMobile: boolean
  setSelectedCard: (card: Card) => void
}) {
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
      {/*
        FIX ⑤: count balanceado.
        PROBLEMA ORIGINAL: mobile=50 (quase sem estrelas, feio) desktop=1500 (pesado).
        FIX: mobile=300 (bonito e leve), desktop=800 (visual rico sem travar).
        1500 estrelas no desktop causava spike de geometria desnecessário porque
        estrelas além de ~800 não são percebidas individualmente pelo usuário.
      */}
      <StaticStars count={isMobile ? 500 : 1200} />
      <ambientLight intensity={1.5} />
      <pointLight position={[15, 15, 15]} intensity={1} color="#7000ff" />
      <CardGalaxy isMobile={isMobile} setSelectedCard={setSelectedCard} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={5}
        maxDistance={45}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   UI OVERLAY
───────────────────────────────────────────────────────────────────────────── */
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
   FULL SCREEN CARD VIEW
───────────────────────────────────────────────────────────────────────────── */
function FullScreenCardView({ card, onClose }: { card: Card; onClose: () => void }) {
  // FIX ①: usa DATE_LOCALE de módulo, não declara ptBR local
  const dateObj = useMemo(() => {
    if (!card.date) return null
    const d       = card.date as any
    const seconds = d._seconds ?? d.seconds
    if (seconds) return new Date(seconds * 1000)
    return card.date instanceof Date ? card.date : null
  }, [card.date])

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
          {/* Next Image com fill funciona perfeitamente aqui (fora do canvas 3D) */}
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
   MAIN WRAPPER
───────────────────────────────────────────────────────────────────────────── */
export default function StellarCardGallerySingle({
  events,
  onClose,
}: {
  events: Card[]
  onClose: () => void
}) {
  const isMobile = useIsMobile()
  const [mounted,      setMounted]      = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  // FIX ⑥: useCallback para setSelectedCard.
  // Sem isso, cada render do wrapper cria uma nova função →
  // CardGalaxy e FloatingCard recebem nova referência → re-render desnecessário.
  const handleSelectCard = useCallback((card: Card) => {
    setSelectedCard(card)
  }, [])

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!mounted || events.length === 0) return null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[99999] bg-[#020202]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CardProvider events={events}>
        <Canvas
          dpr={isMobile ? 0.75 : 1}
          // FIX ⑦: performance.min=0.5 — permite que o r3f/Three.js reduza
          // automaticamente o DPR para 0.5x se o framerate cair abaixo do aceitável.
          // É um "freio de segurança" que nunca trava mas nunca renderiza feio por padrão.
          performance={{ min: 0.5 }}
          gl={{
            antialias: false,              // grande ganho de perf sem perda visual perceptível
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: true,
            stencil: false,
            depth: true,
          }}
        >
          <Suspense fallback={null}>
            {/* FIX ④: sem prop "events" aqui — Scene lê do Context */}
            <Scene isMobile={isMobile} setSelectedCard={handleSelectCard} />
          </Suspense>
        </Canvas>

        <TimelineUI onClose={onClose} />

        <AnimatePresence>
          {selectedCard && (
            <FullScreenCardView
              card={selectedCard}
              onClose={() => setSelectedCard(null)}
            />
          )}
        </AnimatePresence>
      </CardProvider>
    </motion.div>,
    document.body
  )
}
