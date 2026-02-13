"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import Image from "next/image"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Stars } from "@react-three/drei"
import { X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR, enUS, es } from "date-fns/locale"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"
import { useTranslation } from "@/lib/i18n"

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
   Floating Card (CORREÇÃO DE Z-INDEX)
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
  const [isLoaded, setIsLoaded] = useState(false)
  const { locale } = useTranslation();
  
  const baseScale = isMobile ? 1.25 : 1.44;
  const cardWidthPx = isMobile ? 140 : 220; 
  // Aumentei um pouquinho a largura da máscara (1.26) para garantir bloqueio total das bordas
  const planeWidth = (cardWidthPx / 100) * 1.26 
  const planeHeight = planeWidth / (3/4)

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
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={baseScale}>
      
      {/* MÁSCARA DE BLOQUEIO (Invisível, mas sólida para o Renderizador) */}
      <mesh 
        ref={occludeRef}
        renderOrder={-1} // Renderiza primeiro para criar o "buraco" no buffer
      >
         {/* Geometria levemente maior para cobrir bordas HTML */}
         <planeGeometry args={[planeWidth, planeHeight]} />
         <meshBasicMaterial 
            colorWrite={false}     // Não desenha cor
            depthWrite={true}      // Escreve na profundidade (CRUCIAL)
            depthTest={true}       
            side={THREE.DoubleSide}
            transparent={false}    // Opaco para o motor de física da luz
         />
      </mesh>

      <Html
        transform
        occlude={[occludeRef]}
        distanceFactor={8} 
        position={[0, 0, 0.05]} // Bem próximo da malha para não flutuar muito
        // AQUI ESTÁ A CORREÇÃO DA "BOMBA":
        // Range gigante garante que 0.001 de diferença no 3D vire 1 ponto inteiro no Z-Index do CSS
        zIndexRange={[100000, 0]}  
        style={{ 
            pointerEvents: 'none',
            transformStyle: 'preserve-3d', 
            willChange: 'transform', 
        }} 
      >
        <div
          className="relative flex flex-col text-center select-none rounded-xl overflow-hidden"
          style={{
            width: `${cardWidthPx}px`,
            background: 'transparent',
            boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0,0,0,0.5)', 
            border: isMobile ? '1px solid rgba(255,255,255,0.1)' : 'none',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)', 
          }}
        >
            <div className="relative w-full aspect-[3/4] bg-zinc-900/90 overflow-hidden rounded-xl border border-white/5">
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0">
                    <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                  </div>
                )}
                
                <Image
                    src={card.imageUrl}
                    alt={card.alt}
                    fill
                    className={cn(
                        "object-cover transition-opacity duration-300",
                        isLoaded ? "opacity-100" : "opacity-0"
                    )}
                    unoptimized={true}
                    sizes="(max-width: 768px) 150px, 250px"
                    onLoadingComplete={() => setIsLoaded(true)}
                />
                
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-10 pb-3 px-2">
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
                </div>
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
    
    // Raio dinâmico para evitar que as imagens fiquem muito juntas
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

  // Pixel Ratio: Segura a onda no iPhone para não travar
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
                  antialias: false,
                  powerPreference: 'high-performance', 
                  alpha: false,
                  stencil: false,
                  depth: true,
                  // ISSO AQUI AJUDA A RESOLVER SOBREPOSIÇÃO DE OBJETOS PRÓXIMOS
                  logarithmicDepthBuffer: true,
                  precision: 'mediump'
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
