"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext, useCallback } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { X } from "lucide-react"
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
   CANVAS-TO-TEXTURE HELPERS
───────────────────────────────────────────────────────────────────────────── */
function toSameOriginUrl(url: string, w: number): string {
  if (typeof window === 'undefined') return url
  try {
    const u = new URL(url, window.location.origin)
    if (u.origin === window.location.origin) return url
    return `/_next/image?url=${encodeURIComponent(url)}&w=${w <= 384 ? 384 : 640}&q=75`
  } catch {
    return url
  }
}

function loadImageOnce(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function loadImage(url: string, retries = 2): Promise<HTMLImageElement> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      return await loadImageOnce(url)
    } catch (e) {
      lastErr = e
      if (i < retries) await new Promise((r) => setTimeout(r, 300 * (i + 1)))
    }
  }
  throw lastErr
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number) {
  const ir = img.naturalWidth / img.naturalHeight
  const dr = dw / dh
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (ir > dr) {
    sw = img.naturalHeight * dr
    sx = (img.naturalWidth - sw) / 2
  } else {
    sh = img.naturalWidth / dr
    sy = (img.naturalHeight - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const test = current ? current + ' ' + w : w
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = w
      if (lines.length >= maxLines) break
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1]
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 0) last = last.slice(0, -1)
    if (words.join(' ').length > lines.join(' ').length) last = last.replace(/\s+\S*$/, '') + '…'
    lines[maxLines - 1] = last
  }
  return lines
}

async function renderCardToCanvas(card: Card, w: number, h: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const radius = Math.round(w * 0.07)

  // rounded clip
  ctx.save()
  ctx.beginPath()
  // @ts-ignore roundRect is available in modern browsers
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(0, 0, w, h, radius)
  } else {
    ctx.moveTo(radius, 0)
    ctx.arcTo(w, 0, w, h, radius)
    ctx.arcTo(w, h, 0, h, radius)
    ctx.arcTo(0, h, 0, 0, radius)
    ctx.arcTo(0, 0, w, 0, radius)
  }
  ctx.closePath()
  ctx.clip()

  // background fallback
  ctx.fillStyle = '#1a0828'
  ctx.fillRect(0, 0, w, h)

  // image
  try {
    const proxied = toSameOriginUrl(card.imageUrl, w)
    const img = await loadImage(proxied)
    drawImageCover(ctx, img, 0, 0, w, h)
  } catch {
    // fallback gradient
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#2d1253')
    g.addColorStop(1, '#0f0520')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  // bottom gradient overlay
  const gradStart = h * 0.3
  const grad = ctx.createLinearGradient(0, gradStart, 0, h)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(0.55, 'rgba(0,0,0,0.6)')
  grad.addColorStop(1, 'rgba(0,0,0,0.92)')
  ctx.fillStyle = grad
  ctx.fillRect(0, gradStart, w, h - gradStart)

  // title
  const pad = Math.round(w * 0.075)
  const titleSize = Math.round(w * 0.1)
  const lineH = Math.round(titleSize * 1.1)
  ctx.font = `bold ${titleSize}px -apple-system, "Segoe UI", Roboto, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0,0,0,0.85)'
  ctx.shadowBlur = 6
  const titleText = card.title.length > 80 ? card.title.slice(0, 80) + '…' : card.title
  const lines = wrapText(ctx, titleText, w - pad * 2, 2)

  const dateObj = parseDateObj(card.date)
  const dateSize = Math.round(w * 0.055)
  const dateGap = dateObj ? Math.round(dateSize * 1.6) : 0

  const totalTextH = lines.length * lineH + dateGap
  let y = h - pad - totalTextH + lineH * 0.85
  for (const line of lines) {
    ctx.fillText(line, pad, y)
    y += lineH
  }

  // date
  if (dateObj) {
    ctx.shadowBlur = 4
    ctx.fillStyle = '#c084fc'
    ctx.font = `600 ${dateSize}px -apple-system, "Segoe UI", Roboto, sans-serif`
    const dateText = format(dateObj, "dd MMM yyyy", { locale: DATE_LOCALE })
    ctx.fillText(dateText, pad, h - pad)
  }

  // border
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 2
  // @ts-ignore
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(1, 1, w - 2, h - 2, radius - 1)
    ctx.stroke()
  }

  ctx.restore()
  return canvas
}

function useCardTexture(card: Card, w: number, h: number): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    let tex: THREE.CanvasTexture | null = null

    renderCardToCanvas(card, w, h).then((canvas) => {
      if (cancelled) return
      tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = false
      tex.anisotropy = 2
      setTexture(tex)
    }).catch(() => { /* swallow */ })

    return () => {
      cancelled = true
      if (tex) tex.dispose()
    }
  }, [card.id, card.imageUrl, card.title, w, h])

  return texture
}

/* ─────────────────────────────────────────────────────────────────────────────
   FULL SCREEN CARD VIEW
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
   3D — textured plane card (WebGL, no DOM)
───────────────────────────────────────────────────────────────────────────── */
const CardPlane = React.memo(function CardPlane({
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
  const frontMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const readyAtRef = useRef<number | null>(null)
  const texW = isMobile ? 256 : 384
  const texH = Math.round(texW * 4 / 3)
  const texture = useCardTexture(card, texW, texH)

  const cardH = isMobile ? 2.8 : 3.6
  const cardW = cardH * 0.75

  useEffect(() => {
    if (texture && readyAtRef.current === null) {
      readyAtRef.current = performance.now()
    }
  }, [texture])

  useFrame(({ camera }) => {
    if (!groupRef.current) return
    groupRef.current.lookAt(camera.position)
    // fade-in when texture becomes ready (400ms)
    if (readyAtRef.current !== null && frontMatRef.current) {
      const t = Math.min(1, (performance.now() - readyAtRef.current) / 220)
      const eased = t * (2 - t) // easeOutQuad
      frontMatRef.current.opacity = eased
      if (haloMatRef.current) haloMatRef.current.opacity = 0.15 * eased
    } else if (haloMatRef.current) {
      haloMatRef.current.opacity = 0
    }
  })

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick()
  }, [onClick])

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* subtle purple halo behind */}
      <mesh position={[0, 0, -0.02]} scale={[cardW * 1.15, cardH * 1.15, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={haloMatRef} color="#6d28d9" transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* card */}
      {texture && (
        <mesh onClick={handleClick}>
          <planeGeometry args={[cardW, cardH]} />
          <meshBasicMaterial ref={frontMatRef} map={texture} transparent opacity={0} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
})
CardPlane.displayName = 'CardPlane'

function StaticStars({ count = 180 }: { count?: number }) {
  const attr = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const radius = 80
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)
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
    const phi = Math.PI * (3 - Math.sqrt(5))
    const baseRadius = isMobile ? 6.7 : 11.2
    const radius = baseRadius + Math.sqrt(n) * 0.5
    const yFactor = isMobile ? 1.6 : 1.2
    return Array.from({ length: n }, (_, i) => {
      const y = 1 - (i / (n - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = phi * i
      return { x: Math.cos(theta) * r * radius, y: y * radius * yFactor, z: Math.sin(theta) * r * radius }
    })
  }, [cards, isMobile])

  return (
    <group>
      {cards.map((card, i) =>
        cardPositions[i] ? (
          <CardPlane key={card.id} card={card} position={cardPositions[i]} isMobile={isMobile} onClick={() => setSelectedCard(card)} />
        ) : null
      )}
    </group>
  )
}

function Scene({ isMobile, setSelectedCard }: { isMobile: boolean; setSelectedCard: (card: Card) => void }) {
  const { camera, invalidate } = useThree()
  useEffect(() => {
    camera.position.set(0, 0, isMobile ? 22 : 32)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = isMobile ? 75 : 55
      camera.updateProjectionMatrix()
    }
    invalidate()
  }, [isMobile, camera, invalidate])

  return (
    <>
      <color attach="background" args={['#020202']} />
      <StaticStars count={isMobile ? 260 : 500} />
      <CardGalaxy isMobile={isMobile} setSelectedCard={setSelectedCard} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        enablePan={false}
        minDistance={5}
        maxDistance={45}
        autoRotate
        autoRotateSpeed={isMobile ? 0.25 : 0.3}
      />
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
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const handleSelectCard = useCallback((card: Card) => setSelectedCard(card), [])

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
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          performance={{ min: 0.5 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
        >
          <Suspense fallback={null}>
            <Scene isMobile={isMobile} setSelectedCard={handleSelectCard} />
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
