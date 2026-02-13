"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Stars } from "@react-three/drei"
import { X, Loader2 } from "lucide-react"
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
   Floating Card
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
  const [isLoaded, setIsLoaded] = useState(false)
  const { locale } = useTranslation();
  
  useFrame(({ camera }) => {
    if (groupRef.current) groupRef.current.lookAt(camera.position)
  })

  const dateLocales: { [key: string]: Locale } = {
    pt: ptBR,
    en: enUS,
    es: es,
  };
  const fnsLocale = dateLocales[locale] || ptBR;

  const dateObj = useMemo(() => {
      if (!card.date) return null;
      if (card.date instanceof Date) return card.date;
      const seconds = (card.date as any)._seconds || (card.date as any).seconds;
      if (seconds) return new Date(seconds * 1000);
      return null;
  }, [card.date]);

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={isMobile ? 1.25 : 1.44}>
      <Html
        transform
        distanceFactor={8} 
        zIndexRange={[100000, 0]}  
        style={{ 
            pointerEvents: 'none',
            transformStyle: 'preserve-3d', 
            willChange: 'transform', 
        }} 
      >
        <div
          className="relative text-center select-none rounded-xl overflow-hidden"
          style={{
            width: isMobile ? `140px` : `220px`,
            aspectRatio: '3/4',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)', 
          }}
        >
            {!isLoaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
                <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
              </div>
            )}

            <Image
                src={card.imageUrl}
                alt={card.alt}
                fill
                unoptimized
                className={cn(
                    "object-cover transition-opacity duration-500",
                    isLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoadingComplete={() => setIsLoaded(true)}
            />
            
            <AnimatePresence>
            {isLoaded && (
              <motion.div
                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-10 pb-3 px-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                  {card.title && (
                     <p className={`text-white/95 font-semibold text-sm leading-tight drop-shadow-lg mb-1 line-clamp-2 [text-wrap:balance]`}>
                        {card.title}
                     </p>
                  )}
                  
                  {dateObj && (
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                          <div className="h-[1px] w-3 bg-purple-500/60"></div>
                          <p className="text-purple-300 font-bold text-xs tracking-wider uppercase font-sans drop-shadow-md">
                              {format(dateObj, "dd MMM yyyy", { locale: fnsLocale })}
                          </p>
                          <div className="h-[1px] w-3 bg-purple-500/60"></div>
                      </div>
                  )}
              </motion.div>
            )}
            </AnimatePresence>
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
   Scene
   ========================= */
function Scene({ isMobile, events }: { isMobile: boolean, events: Card[] }) {
    const { camera } = useThree();

    useEffect(() => {
        const targetZ = isMobile ? 19 : 30; 
        const targetFov = isMobile ? 80 : 60; 
        
        camera.position.set(0, 0, targetZ);
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = targetFov;
            camera.updateProjectionMatrix();
        }
    }, [isMobile, camera]);

    return (
        <>
            <Stars
                radius={60} 
                depth={40} 
                count={isMobile ? 250 : 2000} 
                factor={3} 
                saturation={0} 
                fade={true} 
                speed={0.3} 
            />
            
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color={"#a8a8ff"} />
            
            <CardGalaxy isMobile={isMobile} />
            
            <OrbitControls
                makeDefault
                enableDamping={true}
                dampingFactor={0.07} 
                enablePan={false}
                enableZoom={true}
                zoomSpeed={0.8}
                rotateSpeed={0.6}
                minDistance={4}
                maxDistance={35}
                autoRotate={true} 
                autoRotateSpeed={0.5}
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
   Main Wrapper
   ========================= */
export default function StellarCardGallerySingle({ events, onClose }: { events: Card[], onClose: () => void }) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const dpr = useMemo(() => isMobile ? [1, 1.5] : [1, 2], [isMobile]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed'; 
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden'; 
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (!mounted || events.length === 0) return null;

  return createPortal(
    <motion.div 
      className="fixed inset-0 z-[99999] bg-[#020202] m-0 p-0 touch-none block"
      style={{ 
          height: '100dvh',
          width: '100vw',
          overscrollBehavior: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: 'translateZ(0)' 
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardProvider events={events}>
        <Suspense fallback={
            <div className="fixed inset-0 z-[10002] flex items-center justify-center text-white bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            </div>
        }>
            <Canvas
              dpr={dpr as any} 
              gl={{ 
                  antialias: true, // Ligar para melhor qualidade de imagem
                  powerPreference: 'high-performance', 
                  alpha: false,
                  stencil: false,
                  depth: true,
                  logarithmicDepthBuffer: true,
              }}
              resize={{ debounce: 200 }} 
              className="absolute inset-0 z-10 block"
            >
                <Scene isMobile={isMobile} events={events} />
            </Canvas>
        </Suspense>
        <TimelineUI onClose={onClose} />
      </CardProvider>
    </motion.div>,
    document.body
  )
}
