"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import Image from "next/image"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Stars } from "@react-three/drei"
import { X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"

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
   Floating Card (FAST LOAD + Z-INDEX FIX)
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
  
  const baseScale = isMobile ? 1.25 : 1.44;
  const cardWidthPx = isMobile ? 140 : 220; 
  
  const planeWidth = (cardWidthPx / 100) * 1.2
  const planeHeight = planeWidth / (3/4)

  useFrame(({ camera }) => {
    if (groupRef.current) groupRef.current.lookAt(camera.position)
  })

  const dateObj = useMemo(() => {
      if (!card.date) return null;
      if (card.date instanceof Date) return card.date;
      const seconds = (card.date as any)._seconds || (card.date as any).seconds;
      if (seconds) return new Date(seconds * 1000);
      return null;
  }, [card.date]);

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={baseScale}>
      {/* 
         FIX: Usar BoxGeometry (com espessura 0.1) em vez de PlaneGeometry. 
         Isso cria um volume 3D real que bloqueia o fundo com mais precisão.
      */}
      <mesh ref={occludeRef}>
         <boxGeometry args={[planeWidth, planeHeight, 0.2]} />
         <meshBasicMaterial 
            colorWrite={false}
            depthWrite={true}
            side={THREE.DoubleSide} // Garante bloqueio dos dois lados
         />
      </mesh>

      <Html
        transform
        occlude={[occludeRef]}
        distanceFactor={8} 
        position={[0, 0, 0.11]} // Levemente à frente da "caixa" invisível
        zIndexRange={[100, 0]} 
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
            // TRUQUE 60FPS: No mobile, troquei Shadow Pesada por Borda Sutil. 
            // Shadow com blur radius alto mata performance. Borda é grátis pra GPU.
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
                        "object-cover transition-opacity duration-500",
                        isLoaded ? "opacity-100" : "opacity-0"
                    )}
                    unoptimized={false} // Next Image otimiza o tamanho (webp/avif)
                    // Sizes ajustado: baixa img de ~150px no celular (super leve)
                    sizes="(max-width: 768px) 150px, 250px"
                    priority={true} // CARREGAMENTO IMEDIATO
                    onLoad={() => setIsLoaded(true)}
                />
                
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-10 pb-3 px-2">
                    {card.title && (
                       <p className={`text-white/95 font-medium text-xs leading-tight drop-shadow-md mb-1 line-clamp-2 ${!isMobile ? '[text-wrap:balance]' : ''}`}>
                          {card.title}
                       </p>
                    )}
                    
                    {dateObj && (
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                            <div className="h-[1px] w-3 bg-purple-500/60"></div>
                            <p className="text-purple-300 font-bold text-[9px] tracking-wider uppercase font-sans">
                                {format(dateObj, "dd MMM yyyy", { locale: ptBR })}
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
    // Raio Compacto: 8
    const radius = isMobile ? 8 : 12; 
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
   Scene (HIGH PERFORMANCE SETUP)
   ========================= */
function Scene({ isMobile, events }: { isMobile: boolean, events: Card[] }) {
    const { camera } = useThree();

    useEffect(() => {
        // Câmera muito próxima para layout compacto
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
            <color attach="background" args={['#020202']} />
            
            <Stars
                radius={60} 
                depth={40} 
                count={isMobile ? 400 : 2000} // Estrelas mínimas no mobile
                factor={3} 
                saturation={0} 
                fade={true} 
                speed={0.3} 
            />
            
            <ambientLight intensity={0.7} color={"#fff"} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color={"#a8a8ff"} />
            
            <CardGalaxy isMobile={isMobile} />
            
            <OrbitControls
                makeDefault
                enableDamping={true}
                dampingFactor={0.07} 
                enablePan={false} // Importante: Travamos o PAN para usuário não perder a galáxia
                enableZoom={true}
                zoomSpeed={0.8}
                rotateSpeed={0.6}
                minDistance={4}
                maxDistance={35}
                autoRotate={events.length > 2 && !isMobile} 
                autoRotateSpeed={0.5}
            />
        </>
    );
}

/* =========================
   UI
   ========================= */
const TimelineUI = ({ onClose }: { onClose: () => void }) => (
    <>
        <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none h-24">
            <div className="text-white pointer-events-none pl-1">
                <h1 className="text-lg font-bold drop-shadow-xl font-headline tracking-wide">Linha do Tempo</h1>
                <p className="text-[10px] text-white/70">Toque e arraste para girar</p>
            </div>
            <button 
                onClick={onClose} 
                className="pointer-events-auto bg-white/10 active:bg-white/20 backdrop-blur-md text-white rounded-full p-3 shadow-lg active:scale-90 transition-transform touch-manipulation border border-white/5"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    </>
);

/* =========================
   Main Wrapper
   ========================= */
export default function StellarCardGallerySingle({ events, onClose }: { events: Card[], onClose: () => void }) {
  const isMobile = useIsMobile();
  const dpr = 1;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted || events.length === 0) return null;

  return createPortal(
    <motion.div 
      className="fixed inset-0 w-full h-[100dvh] z-[9999] bg-[#020202] touch-none overscroll-none left-0 top-0 m-0 p-0 block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CardProvider events={events}>
        <Suspense fallback={
            <div className="fixed inset-0 z-[10002] flex items-center justify-center text-white bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                <p className="absolute mt-16 text-xs text-white/50 animate-pulse">Carregando memórias...</p>
            </div>
        }>
            <Canvas
              dpr={dpr}
              gl={{ 
                  antialias: false, 
                  powerPreference: 'high-performance', 
                  alpha: false,
                  stencil: false,
                  depth: true,
                  precision: 'mediump'
              }}
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
