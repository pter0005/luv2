
"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Stars } from "@react-three/drei"
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
   Floating Card (RESTAURADO E BLINDADO)
   ========================= */
function FloatingCard({
  card,
  position,
  isMobile,
}: {
  card: Card
  position: { x: number; y: number; z: number }
  isMobile: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const occludeRef = useRef<THREE.Mesh>(null)
  const { locale } = useTranslation();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
      console.log(`[3D Gallery] Rendering image: ${card.imageUrl}`);
  }, [card.imageUrl]);
  
  // LookAt suave para a câmera
  useFrame(({ camera }) => {
    if (groupRef.current) groupRef.current.lookAt(camera.position)
  })

  const dateLocales: { [key: string]: Locale } = { pt: ptBR, en: enUS, es: es };
  const fnsLocale = dateLocales[locale] || ptBR;

  const dateObj = useMemo(() => {
      if (!card.date) return null;
      if (card.date instanceof Date) return card.date;
      const seconds = (card.date as any)._seconds || (card.date as any).seconds;
      return seconds ? new Date(seconds * 1000) : null;
  }, [card.date]);

  const cardWidthPx = isMobile ? 140 : 220;
  const planeWidth = (cardWidthPx / 100) * 1.26;
  const planeHeight = planeWidth / (3/4);

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={isMobile ? 1.25 : 1.44}>
      
      {/* MÁSCARA DE PROFUNDIDADE (Garante que um card não atravesse o outro) */}
      <mesh ref={occludeRef} renderOrder={-1}>
         <planeGeometry args={[planeWidth, planeHeight]} />
         <meshBasicMaterial 
            colorWrite={false} 
            depthWrite={true} 
            transparent={false} 
            side={THREE.DoubleSide} 
         />
      </mesh>

      <Html
        transform
        occlude={[occludeRef]}
        distanceFactor={8} 
        position={[0, 0, 0.08]} // Offset leve para evitar cintilação (flicker)
        zIndexRange={[200000, 0]} // Range massivo para precisão de camadas
        style={{ 
            pointerEvents: 'none',
            transformStyle: 'preserve-3d', 
            willChange: 'transform', 
        }} 
      >
        <div
          className="relative rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
          style={{
            width: `${cardWidthPx}px`,
            aspectRatio: '3/4',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
            {imageError ? (
                <div className="w-full h-full bg-red-900/50 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
            ) : (
                <img
                    src={card.imageUrl}
                    alt={card.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => {
                        console.error(`[CMD_LOG]: LOAD FAILED! Could not load image: ${card.imageUrl}`);
                        setImageError(true);
                    }}
                />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                {card.title && (
                    <p className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1 drop-shadow-md">
                        {card.title}
                    </p>
                )}
                {dateObj && (
                    <p className="text-purple-400 font-black text-[10px] uppercase tracking-tighter">
                        {format(dateObj, "dd MMM yyyy", { locale: fnsLocale })}
                    </p>
                )}
            </div>
        </div>
      </Html>
    </group>
  )
}

/* =========================
   Galaxy Geometry
   ========================= */
function CardGalaxy({ isMobile }: { isMobile: boolean }) {
  const { cards } = useCard()

  const cardPositions = useMemo(() => {
    const positions: { x: number; y: number; z: number }[] = []
    const numCards = cards.length;
    if (numCards === 0) return [];
    if (numCards === 1) return [{ x: 0, y: 0, z: 0 }];

    const phi = Math.PI * (3 - Math.sqrt(5)); 
    
    const baseRadius = isMobile ? 5.8 : 9.7;
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
        />
      ))}
    </group>
  )
}


/* =========================
   Scene (VISUAL PREMIUM)
   ========================= */
function Scene({ isMobile, events }: { isMobile: boolean, events: Card[] }) {
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
            <fog attach="fog" args={['#020202', 10, 50]} />
            
            {/* Estrelas com maior contagem para beleza visual */}
            <Stars
                radius={80} 
                depth={60} 
                count={isMobile ? 1200 : 4000} 
                factor={isMobile ? 5 : 4} 
                saturation={0} 
                fade={true} 
                speed={0.4} 
            />
            
            <ambientLight intensity={1.2} />
            <pointLight position={[15, 15, 15]} intensity={1} color="#7000ff" />
            
            <CardGalaxy isMobile={isMobile} />
            
            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.05}
                enablePan={false}
                minDistance={5}
                maxDistance={45}
                autoRotate
                autoRotateSpeed={0.4}
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
   Main Wrapper (LISO E OTIMIZADO)
   ========================= */
export default function StellarCardGallerySingle({ events, onClose }: { events: Card[], onClose: () => void }) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

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
          dpr={isMobile ? [1, 1.5] : [1, 2]} // Evita processamento inútil no iPhone
          gl={{ 
              antialias: false, // Otimização para Android 120hz
              powerPreference: 'high-performance', 
              logarithmicDepthBuffer: true, // Crucial para não ter erro de sobreposição
              stencil: false,
              depth: true
          }}
        >
            <Suspense fallback={null}>
                <Scene isMobile={isMobile} events={events} />
            </Suspense>
        </Canvas>
        <TimelineUI onClose={onClose} />
      </CardProvider>
    </motion.div>,
    document.body
  )
}

    