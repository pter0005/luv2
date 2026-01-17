"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import Image from "next/image"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Stars } from "@react-three/drei"
import { X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

/* =========================
   Types
   ========================= */
type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date?: Date | { seconds: number, _seconds?: number }
}

/* =========================
   Card Context
   ========================= */
type CardContextType = {
  cards: Card[]
}

const CardContext = createContext<CardContextType | undefined>(undefined)

function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("useCard must be used within CardProvider")
  return ctx
}

function CardProvider({ children, events }: { children: React.ReactNode, events: Card[] }) {
  const value = useMemo(() => ({ cards: events }), [events]);
  return (
    <CardContext.Provider value={value}>
      {children}
    </CardContext.Provider>
  )
}

/* =========================
   Mobile Detection
   ========================= */
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        let timeoutId: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(check, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        }
    }, []);
    return isMobile;
}

/* =========================
   Floating Card (FINAL / STABLE)
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
  
  const baseScale = isMobile ? 1.5 : 1.6;
  const cardWidthPx = isMobile ? 150 : 220;
  
  // Ajuste matemático fino para o Plane cobrir exatamente o HTML sem vazar
  const planeWidth = (cardWidthPx / 100) * 1.2
  const planeHeight = planeWidth / (3/4)

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })

  const dateObj = useMemo(() => {
      if (!card.date) return null;
      if (card.date instanceof Date) return card.date;
      const seconds = (card.date as any)._seconds || (card.date as any).seconds;
      if (seconds) return new Date(seconds * 1000);
      return null;
  }, [card.date]);

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      scale={baseScale}
    >
      {/* 
          DEPTH MASK SUPER SÓLIDO
          - colorWrite={false}: Invisível
          - depthWrite={true}: Escreve na profundidade
          - blending={NoBlending}: Otimiza renderização e evita transparência acidental
          - transparent={false}: Força tratamento de objeto sólido
      */}
      <mesh ref={occludeRef}>
         <planeGeometry args={[planeWidth, planeHeight]} />
         <meshBasicMaterial 
            colorWrite={false}
            depthWrite={true}
            transparent={false}
            blending={THREE.NoBlending}
            side={THREE.DoubleSide}
         />
      </mesh>

      <Html
        transform
        occlude={[occludeRef]}
        distanceFactor={8} 
        position={[0, 0, 0.08]} // Offset aumentado levemente para evitar flicker
        zIndexRange={[500, 0]} // Range normalizado para evitar bugs de browser
        style={{ 
            pointerEvents: 'none',
            transformStyle: 'preserve-3d', // Ajuda no renderizador do Chrome mobile
        }} 
      >
        <div
          className="relative flex flex-col text-center select-none rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: `${cardWidthPx}px`,
            background: 'transparent',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            // Força aceleração de hardware no elemento
            transform: 'translateZ(0)',
          }}
        >
            <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden rounded-xl border border-white/10">
                <Image
                    src={card.imageUrl}
                    alt={card.alt}
                    fill
                    className="object-cover"
                    unoptimized={false}
                    sizes="(max-width: 768px) 150px, 250px"
                    quality={75}
                    priority={false}
                />
                
                {/* --- ÁREA DE TEXTO ESTILIZADA (NOVA VERSÃO) --- */}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-12 pb-4 px-4 text-center">
                    {card.title && (
                        <p className="text-white text-sm font-medium leading-snug drop-shadow-lg mb-2.5 [text-wrap:balance]">
                           {card.title}
                        </p>
                    )}
                    
                    {dateObj && (
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-[1px] w-5 bg-gradient-to-r from-transparent to-purple-400 opacity-80"></div>
                             <p className="text-purple-300 font-bold text-xs tracking-widest uppercase font-sans drop-shadow-sm">
                                {format(dateObj, "dd MMM yyyy", { locale: ptBR })}
                            </p>
                            <div className="h-[1px] w-5 bg-gradient-to-l from-transparent to-purple-400 opacity-80"></div>
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
   Card Galaxy
   ========================= */
function CardGalaxy({ isMobile }: { isMobile: boolean }) {
  const { cards } = useCard()

  const cardPositions = useMemo(() => {
    const positions: { x: number; y: number; z: number }[] = []
    const numCards = cards.length;
    if (numCards === 0) return [];
    if (numCards === 1) return [{ x: 0, y: 0, z: 0 }];

    const phi = Math.PI * (3 - Math.sqrt(5)); 
    const radius = isMobile ? 12 : 18;
    const yFactor = isMobile ? 1.3 : 1; 

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
        cardPositions[i] && <FloatingCard key={card.id} card={card} position={cardPositions[i]} isMobile={isMobile} />
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
        const targetZ = isMobile ? 32 : 38;
        const targetFov = isMobile ? 75 : 60; 
        
        camera.position.set(0, 0, targetZ);
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = targetFov;
            camera.updateProjectionMatrix();
        }
    }, [isMobile, camera]);

    return (
        <>
            <color attach="background" args={['#050505']} />
            
            <Stars
                radius={80} 
                depth={40} 
                count={isMobile ? 1500 : 4000} 
                factor={4} 
                saturation={0} 
                fade={true} 
                speed={0.4} 
            />
            
            <ambientLight intensity={0.6} color={"#fff"} />
            <pointLight position={[10, 10, 10]} intensity={0.5} color={"#a8a8ff"} />
            
            <CardGalaxy isMobile={isMobile} />
            
            <OrbitControls
                makeDefault
                enableDamping={true}
                dampingFactor={0.05} 
                enablePan={!isMobile} 
                enableZoom={true}
                zoomSpeed={0.8}
                rotateSpeed={0.6}
                minDistance={5} 
                maxDistance={60}
                autoRotate={events.length > 2 && !isMobile} 
                autoRotateSpeed={0.5}
            />
        </>
    );
}

/* =========================
   UI Overlay
   ========================= */
const TimelineUI = ({ onClose }: { onClose: () => void }) => (
    <>
        <div className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none h-24">
            <div className="text-white pointer-events-none pl-2">
                <h1 className="text-lg font-bold drop-shadow-lg">Nossa Galáxia</h1>
                <p className="text-xs text-white/70">Arraste para explorar.</p>
            </div>
            <button 
                onClick={onClose} 
                className="pointer-events-auto bg-white/10 active:bg-white/20 backdrop-blur-md text-white rounded-full p-2.5 shadow-lg active:scale-90 transition-transform"
                style={{ touchAction: 'manipulation' }}
            >
                <X className="w-6 h-6" />
            </button>
        </div>
    </>
);


/* =========================
   Main Component
   ========================= */

export default function StellarCardGallerySingle({ events, onClose }: { events: Card[], onClose: () => void }) {
  const isMobile = useIsMobile();
  const dpr = isMobile ? 1.25 : [1, 1.5];
  
  if (events.length === 0) return null;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] z-[9999] bg-[#050505] overflow-hidden">
      <CardProvider events={events}>
        <Suspense fallback={
            <div className="fixed inset-0 z-[10002] flex items-center justify-center text-white bg-black">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <Canvas
              dpr={dpr}
              gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
              className="absolute inset-0 z-10 block"
            >
                <Scene isMobile={isMobile} events={events} />
            </Canvas>
        </Suspense>
        <TimelineUI onClose={onClose} />
      </CardProvider>
    </div>
  )
}
