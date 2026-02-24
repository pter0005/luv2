"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import { X, Loader2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { ptBR, enUS, es } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"
import { useTranslation } from "@/lib/i18n"
import Image from 'next/image';

/* =========================
   Types & Context
   ========================= */
type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date?: Date | { seconds: number, _seconds?: number }
}

const CardContext = createContext<{ cards: Card[] } | undefined>(undefined)

function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("useCard must be used within CardProvider")
  return ctx
}

function CardProvider({ children, events }: { children: React.ReactNode, events: Card[] }) {
  const value = useMemo(() => ({ cards: events }), [events]);
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>
}

/* =========================
   Hooks
   ========================= */
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}


/* =========================
   Floating Card (PERFORMANCE & UI UPDATE)
   ========================= */
// Optimization: Create a single Vector3 to reuse in the frame loop.
const _cameraPos = new THREE.Vector3()

function FloatingCard({ card, position, isMobile, onClick }: { card: Card, position: any, isMobile: boolean, onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const occludeRef = useRef<THREE.Mesh>(null)
  const { locale } = useTranslation();
  
  useFrame(({ camera }) => {
    const g = groupRef.current
    if (!g) return

    // Make card always face the camera
    g.lookAt(camera.position);
  })

  const dateLocales: { [key: string]: any } = { pt: ptBR, en: enUS, es: es };
  const fnsLocale = dateLocales[locale] || ptBR;

  const dateObj = useMemo(() => {
      if (!card.date) return null;
      const seconds = (card.date as any)._seconds || (card.date as any).seconds;
      return seconds ? new Date(seconds * 1000) : (card.date instanceof Date ? card.date : null);
  }, [card.date]);

  const cardWidthPx = isMobile ? 140 : 220;

  return (
    <group ref={groupRef} visible={true} position={[position.x, position.y, position.z]} scale={isMobile ? 1.125 : 1.44}>
      <mesh ref={occludeRef} renderOrder={-1}>
         <planeGeometry args={[(cardWidthPx/100)*1.26, (cardWidthPx/100)*1.26/(3/4)]} />
         <meshBasicMaterial colorWrite={false} depthWrite={true} transparent={false} side={THREE.DoubleSide} />
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
          className="relative rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10"
             style={{ width: `${cardWidthPx}px`, aspectRatio: '3/4' }}>
            {/* img nativa para máxima performance no canvas 3D */}
            <img
                src={card.imageUrl}
                alt={card.alt}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                // FIX: If the image fails to load (e.g., due to network issues), retry once.
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.retried) {
                    img.dataset.retried = '1';
                    setTimeout(() => { img.src = card.imageUrl }, 2000);
                  }
                }}
            />
            {/* UI UPDATE: Darker gradient, better font styles and colors */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col justify-end p-4">
                <p className="text-white font-bold text-lg leading-tight line-clamp-3 drop-shadow-lg">{card.title}</p>
                {dateObj && <p className="text-purple-400 font-semibold text-xs tracking-wide mt-1">{format(dateObj, "dd MMM yyyy", { locale: fnsLocale })}</p>}
            </div>
        </div>
      </Html>
    </group>
  )
}

/* =========================
   Static Stars (Optimized)
   ========================= */
function StaticStars({ count = 500 }) {
    const points = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const radius = 80;
        for (let i = 0; i < count; i++) {
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            positions.set([x, y, z], i * 3);
        }
        return new THREE.BufferAttribute(positions, 3);
    }, [count]);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" {...points} />
            </bufferGeometry>
            <pointsMaterial size={0.2} color="white" transparent opacity={0.5} sizeAttenuation={true} />
        </points>
    );
}


/* =========================
   Galaxy Geometry
   ========================= */
function CardGalaxy({ isMobile, setSelectedCard }: { isMobile: boolean, setSelectedCard: (card: Card) => void }) {
  const { cards } = useCard()

  const cardPositions = useMemo(() => {
    const positions: { x: number; y: number; z: number }[] = []
    const numCards = cards.length;
    if (numCards === 0) return [];
    if (numCards === 1) return [{ x: 0, y: 0, z: 0 }];

    const phi = Math.PI * (3 - Math.sqrt(5)); 
    
    const baseRadius = isMobile ? 6.7 : 11.2;
    const radius = baseRadius + (Math.sqrt(numCards) * 0.5);

    const yFactor = isMobile ? 1.6 : 1.2; 

    for (let i = 0; i < numCards; i++) {
        const y = 1 - (i / (numCards - 1)) * 2; 
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;

        positions.push({
            x: Math.cos(theta) * r * radius,
            y: (y * radius * yFactor), 
            z: Math.sin(theta) * r * radius
        });
    }
    return positions
  }, [cards, isMobile])

  return (
    <group>
      {cards.map((card, i) => (
        cardPositions[i] && <FloatingCard 
          key={card.id} 
          card={card} 
          position={cardPositions[i]} 
          isMobile={isMobile}
          onClick={() => setSelectedCard(card)}
        />
      ))}
    </group>
  )
}


/* =========================
   Scene (EQUILIBRADO)
   ========================= */
function Scene({ isMobile, events, setSelectedCard }: { isMobile: boolean, events: Card[], setSelectedCard: (card: Card) => void }) {
    const { camera } = useThree();

    useEffect(() => {
        camera.position.set(0, 0, isMobile ? 22 : 32);
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = isMobile ? 75 : 55;
            camera.updateProjectionMatrix();
        }
    }, [isMobile, camera]);

    return (
        <>
            <color attach="background" args={['#020202']} />
            
            <StaticStars count={isMobile ? 50 : 1500} />
            
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
    );
}

/* =========================
   UI Overlay
   ========================= */
const TimelineUI = ({ onClose }: { onClose: () => void }) => {
    const { t } = useTranslation();
    return (
    <>
        <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none h-24">
            <div className="text-white pointer-events-none pl-1">
                <h1 className="text-lg font-bold drop-shadow-xl font-headline tracking-wide">{t('publicpage.timeline.title')}</h1>
                <p className="text-[10px] text-white/70">{t('publicpage.timeline.description')}</p>
            </div>
            <button 
                onClick={onClose} 
                className="pointer-events-auto bg-white/10 active:bg-white/20 backdrop-blur-md text-white rounded-full p-3 shadow-lg active:scale-90 transition-transform touch-manipulation border border-white/5"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    </>
)};


/* =========================
   Full Screen Card View
   ========================= */
function FullScreenCardView({ card, onClose }: { card: Card, onClose: () => void }) {
  const { t, locale } = useTranslation();
  const dateLocales: { [key: string]: any } = { pt: ptBR, en: enUS, es: es };
  const fnsLocale = dateLocales[locale] || ptBR;

  const dateObj = useMemo(() => {
      if (!card.date) return null;
      const seconds = (card.date as any)._seconds || (card.date as any).seconds;
      return seconds ? new Date(seconds * 1000) : (card.date instanceof Date ? card.date : null);
  }, [card.date]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl">
          <Image src={card.imageUrl} alt={card.alt} fill className="object-contain" />
        </div>
        <div className="text-center text-white p-4 bg-white/5 rounded-xl">
          <h2 className="text-xl font-bold">{card.title}</h2>
          {dateObj && <p className="text-purple-400 font-semibold text-sm mt-1">{format(dateObj, "PPP", { locale: fnsLocale })}</p>}
        </div>
      </div>
      <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-white/10 text-white rounded-full p-3 transition-transform hover:scale-110 active:scale-90"
      >
          <X className="w-6 h-6" />
      </button>
    </motion.div>,
    document.body
  );
}


/* =========================
   Main Wrapper
   ========================= */
export default function StellarCardGallerySingle({ events, onClose }: { events: Card[], onClose: () => void }) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!mounted || events.length === 0) return null;

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
          gl={{ 
              antialias: false,
              powerPreference: 'high-performance', 
              logarithmicDepthBuffer: true,
              stencil: false,
              depth: true
          }}
        >
            <Suspense fallback={null}>
                <Scene isMobile={isMobile} events={events} setSelectedCard={setSelectedCard} />
            </Suspense>
        </Canvas>
        <TimelineUI onClose={onClose} />
        <AnimatePresence>
            {selectedCard && <FullScreenCardView card={selectedCard} onClose={() => setSelectedCard(null)} />}
        </AnimatePresence>
      </CardProvider>
    </motion.div>,
    document.body
  )
}
