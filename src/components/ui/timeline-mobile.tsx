"use client"

// CSS-3D cylinder carousel — no WebGL, no Three.js.
// All transforms are GPU-composited via CSS perspective.
// Direct DOM mutation in RAF — zero React re-renders during animation.

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import Image from "next/image"

const DATE_LOCALE = ptBR

/* ─── Types ────────────────────────────────────────────────────────── */
export type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date?: Date | { seconds: number; _seconds?: number }
}

export function parseDateObj(date: Card["date"]) {
  if (!date) return null
  const d       = date as any
  const seconds = d._seconds ?? d.seconds
  if (seconds) return new Date(seconds * 1000)
  return date instanceof Date ? date : null
}

/* ─── Full-screen card view ─────────────────────────────────────────── */
export function FullScreenCardView({ card, onClose }: { card: Card; onClose: () => void }) {
  const dateObj = useMemo(() => parseDateObj(card.date), [card.date])
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[999999] bg-black/92 backdrop-blur-lg flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative max-w-lg w-full flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
          <Image src={card.imageUrl} alt={card.alt} fill className="object-contain" sizes="95vw" priority />
        </div>
        <div className="text-center text-white p-4 rounded-2xl" style={{ background: "rgba(139,92,246,0.13)", border: "1px solid rgba(139,92,246,0.26)" }}>
          <h2 className="text-xl font-bold leading-snug">{card.title}</h2>
          {dateObj && <p className="text-purple-400 text-sm font-semibold mt-1">{format(dateObj, "PPP", { locale: DATE_LOCALE })}</p>}
        </div>
      </motion.div>
      <button onClick={onClose} className="absolute top-4 right-4 bg-white/10 text-white rounded-full p-3 active:scale-90 transition-all border border-white/10">
        <X className="w-5 h-5" />
      </button>
    </motion.div>,
    document.body,
  )
}

/* ─── Star field (CSS only) ─────────────────────────────────────────── */
function StarField({ count = 80 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top:   `${Math.random() * 100}%`,
        left:  `${Math.random() * 100}%`,
        size:  `${1 + Math.random() * 2}px`,
        delay: `${(Math.random() * 4).toFixed(2)}s`,
        dur:   `${(2 + Math.random() * 3).toFixed(2)}s`,
        opacity: (0.3 + Math.random() * 0.6).toFixed(2),
      })),
    [count],
  )
  return (
    <>
      <style>{`
        @keyframes tw{0%,100%{opacity:0;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              top: s.top, left: s.left,
              width: s.size, height: s.size,
              borderRadius: "50%",
              background: s.id % 5 === 0 ? "#c084fc" : "#fff",
              opacity: s.opacity,
              animation: `tw ${s.dur} ${s.delay} ease-in-out infinite`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  )
}

/* ─── Cylinder Carousel ──────────────────────────────────────────────── */
const CARD_W = 164
const CARD_H = Math.round(CARD_W / (3 / 4))  // 218px

export default function MobileTimeline({ events, onClose }: { events: Card[]; onClose: () => void }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [mounted, setMounted]           = useState(false)

  // Cylinder DOM ref — all animation via direct style mutation
  const cylRef      = useRef<HTMLDivElement>(null)
  const angleRef    = useRef(0)      // current visual angle (degrees)
  const targetRef   = useRef(0)      // target angle (spring destination)
  const velRef      = useRef(0)      // drag velocity
  const dragRef     = useRef(false)
  const lastXRef    = useRef(0)
  const lastTRef    = useRef(0)
  const rafRef      = useRef(0)
  // Per-card glow refs — opacity mutated directly in RAF (composited, no repaint)
  const glowRefs    = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs     = useRef<(HTMLDivElement | null)[]>([])
  const lastFrontRef = useRef(-1)

  const n = events.length
  // Cylinder radius: enough spacing so cards don't overlap
  const radius = useMemo(() => {
    const spacing = CARD_W * 1.18
    return Math.round(Math.max(160, (spacing * n) / (2 * Math.PI)))
  }, [n])

  const stepDeg = 360 / n

  // Snap to nearest card
  const snapNearest = useCallback(() => {
    const raw     = targetRef.current
    const nearest = Math.round(raw / stepDeg) * stepDeg
    targetRef.current = nearest
  }, [stepDeg])

  // RAF animation loop — zero React state during animation
  useEffect(() => {
    if (!mounted) return
    const SPRING  = 0.09   // spring stiffness (per frame)
    const DAMPING = 0.78   // velocity damping
    const AUTO    = 0.18   // auto-rotate degrees/frame

    const loop = () => {
      if (!cylRef.current) { rafRef.current = requestAnimationFrame(loop); return }

      if (!dragRef.current) {
        targetRef.current -= AUTO                        // auto-rotate
        velRef.current     *= DAMPING                   // decay inertia
        angleRef.current   += (targetRef.current - angleRef.current) * SPRING
      } else {
        angleRef.current += (targetRef.current - angleRef.current) * 0.72  // tight follow
      }

      cylRef.current.style.transform = `rotateY(${angleRef.current}deg)`

      // Compute which card is currently at the front and mutate glow/dots directly
      const front = ((Math.round(-angleRef.current / stepDeg) % n) + n) % n
      if (front !== lastFrontRef.current) {
        const prev = lastFrontRef.current
        if (prev >= 0) {
          const pg = glowRefs.current[prev]; if (pg) pg.style.opacity = "0"
          const pd = dotRefs.current[prev];  if (pd) { pd.style.width = "5px"; pd.style.background = "rgba(255,255,255,0.25)" }
        }
        const ng = glowRefs.current[front]; if (ng) ng.style.opacity = "1"
        const nd = dotRefs.current[front];  if (nd) { nd.style.width = "18px"; nd.style.background = "#a855f7" }
        lastFrontRef.current = front
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [mounted, stepDeg, n])

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current  = true
    lastXRef.current = e.touches[0].clientX
    lastTRef.current = performance.now()
    velRef.current   = 0
    // RAF keeps running; loop checks dragRef to switch between follow vs spring
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return
    const now  = performance.now()
    const dx   = e.touches[0].clientX - lastXRef.current
    const dt   = Math.max(1, now - lastTRef.current)
    velRef.current      = (dx / dt) * 16          // px/frame
    targetRef.current  += dx * 0.32               // sensitivity
    lastXRef.current    = e.touches[0].clientX
    lastTRef.current    = now
  }, [])

  const onTouchEnd = useCallback(() => {
    dragRef.current     = false
    targetRef.current  += velRef.current * 5       // fling momentum
    snapNearest()
  }, [snapNearest])

  // Card tap — only if not dragging
  const onCardTap = useCallback((card: Card) => {
    if (Math.abs(velRef.current) > 1.5) return  // ignore if still flinging
    setSelectedCard(card)
  }, [])

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  if (!mounted) return null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[99999] flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #12032a 0%, #06010f 60%, #020008 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Stars */}
      <StarField count={70} />

      {/* Nebula glow behind cylinder */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -58%)",
          width: "320px", height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(120,40,180,0.22) 0%, rgba(80,20,140,0.08) 50%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-5 pt-5 pb-2 shrink-0">
        <div>
          <h1 className="text-white text-lg font-bold tracking-wide drop-shadow-xl">Nossa Linha do Tempo</h1>
          <p className="text-white/40 text-[10px] mt-0.5">Arraste para girar · Toque para ver</p>
        </div>
        <button
          onClick={onClose}
          className="bg-white/10 active:bg-white/25 text-white rounded-full p-3 active:scale-90 transition-all border border-white/10 touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Cylinder stage */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative z-10">
        {/* Perspective wrapper */}
        <div
          style={{ perspective: "700px", perspectiveOrigin: "50% 50%" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Rotating cylinder */}
          <div
            ref={cylRef}
            style={{
              width: `${CARD_W}px`,
              height: `${CARD_H}px`,
              position: "relative",
              transformStyle: "preserve-3d",
              transform: "rotateY(0deg)",
              willChange: "transform",
            }}
          >
            {events.map((card, i) => {
              const cardAngle = i * stepDeg
              const dateObj   = parseDateObj(card.date)

              return (
                <div
                  key={card.id}
                  onClick={() => onCardTap(card)}
                  style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: `${CARD_W}px`,
                    height: `${CARD_H}px`,
                    transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)`,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    cursor: "pointer",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                >
                  {/* Glow halo — composited via opacity only, no repaint */}
                  <div
                    ref={(el) => { glowRefs.current[i] = el }}
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: "-8px",
                      borderRadius: "22px",
                      opacity: 0,
                      transition: "opacity 0.35s ease",
                      pointerEvents: "none",
                      background: "radial-gradient(ellipse at center, rgba(168,85,247,0.55) 0%, rgba(120,40,200,0.25) 40%, transparent 70%)",
                      filter: "blur(12px)",
                      willChange: "opacity",
                    }}
                  />
                  {/* Card */}
                  <div
                    style={{
                      width: "100%", height: "100%",
                      borderRadius: "16px",
                      overflow: "hidden",
                      position: "relative",
                      boxShadow: "0 14px 32px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Image */}
                    <img
                      src={card.imageUrl}
                      alt={card.alt}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      loading="lazy"
                      draggable={false}
                    />
                    {/* Gradient overlay */}
                    <div
                      style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)",
                      }}
                    />
                    {/* Text */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 11px 10px" }}>
                      <p style={{
                        color: "#fff", fontSize: "11px", fontWeight: 700,
                        lineHeight: 1.35, margin: 0,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                      }}>
                        {card.title}
                      </p>
                      {dateObj && (
                        <p style={{ color: "rgba(192,132,252,0.9)", fontSize: "9px", fontWeight: 600, marginTop: "3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {format(dateObj, "dd MMM yyyy", { locale: DATE_LOCALE })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Dot indicators — mutated directly in RAF, no re-render */}
      <div className="relative z-10 flex justify-center gap-1.5 py-4 shrink-0">
        {events.map((_, i) => (
          <div
            key={i}
            ref={(el) => { dotRefs.current[i] = el }}
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "3px",
              background: "rgba(255,255,255,0.25)",
              transition: "width 0.3s ease, background 0.3s ease",
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedCard && <FullScreenCardView card={selectedCard} onClose={() => setSelectedCard(null)} />}
      </AnimatePresence>
    </motion.div>,
    document.body,
  )
}
