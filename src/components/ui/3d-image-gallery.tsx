"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, PerformanceMonitor } from "@react-three/drei"
import { X, Loader2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { ptBR, enUS, es } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"
import { useTranslation } from "@/lib/i18n"
import Image from 'next/image'; // Still needed for FullScreenCardView

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
   Floating Card with CanvasTexture
   ========================= */
function FloatingCard({ card, position, isMobile, onClick }: { card: Card, position: any, isMobile: boolean, onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isVisible, setIsVisible] = useState(true);
  const distanceThreshold = isMobile ? 25 : 40;

  const { locale } = useTranslation();
  const dateLocales: { [key: string]: any } = { pt: ptBR, en: enUS, es: es };
  const fnsLocale = dateLocales[locale] || ptBR;

  const dateObj = useMemo(() => {
    if (!card.date) return null;
    const seconds = (card.date as any)._seconds || (card.date as any).seconds;
    return seconds ? new Date(seconds * 1000) : (card.date instanceof Date ? card.date : null);
  }, [card.date]);

  // The core optimization: UseMemo to create the CanvasTexture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const canvasSize = 512;
    const cardWidth = canvasSize;
    const cardHeight = Math.round(canvasSize / 0.75); // 3:4 aspect ratio
    canvas.width = cardWidth;
    canvas.height = cardHeight;
    const ctx = canvas.getContext('2d')!;

    // 1. Background
    ctx.fillStyle = '#18181b'; // zinc-900
    ctx.beginPath();
    ctx.roundRect(0, 0, cardWidth, cardHeight, 32);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // 2. Text (rendered before image to be underneath)
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 36px sans-serif`;
    
    // Simple word wrapping
    const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (context.measureText(testLine).width > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }
    wrapText(ctx, card.title, 32, cardWidth + 60, cardWidth - 64, 40);

    if (dateObj) {
      ctx.fillStyle = '#c4b5fd'; // violet-300
      ctx.font = `600 28px sans-serif`;
      ctx.fillText(format(dateObj, "dd MMM yyyy", { locale: fnsLocale }), 32, cardWidth + 110);
    }

    return new THREE.CanvasTexture(canvas);
  }, [card.title, dateObj, fnsLocale]);

  // Load image asynchronously and draw it onto the canvas
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = texture.image as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      const cardWidth = canvas.width;
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(24, 24, cardWidth - 48, cardWidth - 48, 24);
      ctx.clip();
      ctx.drawImage(img, 24, 24, cardWidth - 48, cardWidth - 48);
      ctx.restore();
      
      texture.needsUpdate = true;
    };
    img.onerror = () => {
        // Draw an error state on the canvas if image fails
        const canvas = texture.image as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('Error', canvas.width / 2, (canvas.width-48) / 2);
        texture.needsUpdate = true;
    };
    
    // Request a smaller image for better performance
    const optimizedUrl = card.imageUrl.includes("unsplash") 
      ? card.imageUrl.replace(/w=\d+/, "w=512").replace(/q=\d+/, "q=80") 
      : card.imageUrl;
    img.src = optimizedUrl;
  }, [card.imageUrl, texture]);

  // Dispose texture on unmount to free up GPU memory
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  // Frame loop for LOD and facing camera
  useFrame(({ camera }) => {
    if (meshRef.current) {
      meshRef.current.lookAt(camera.position);
      const distance = meshRef.current.position.distanceTo(camera.position);
      const shouldBeVisible = distance < distanceThreshold;
      if (shouldBeVisible !== meshRef.current.visible) {
        meshRef.current.visible = shouldBeVisible;
      }
    }
  });

  const scale = isMobile ? 1.5 : 2.5;

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <planeGeometry args={[scale * 0.75, scale]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
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
          onClick={() => setSelectedCard(card)}
        />
      ))}
    </group>
  )
}


/* =========================
   Scene
   ========================= */
function Scene({ isMobile, events, setSelectedCard, autoRotate, setAutoRotate }: { isMobile: boolean, events: Card[], setSelectedCard: (card: Card) => void, autoRotate: boolean, setAutoRotate: (val: boolean) => void }) {
    const { camera, invalidate } = useThree();

    useEffect(() => {
        camera.position.set(0, 0, isMobile ? 22 : 32);
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = isMobile ? 75 : 55;
            camera.updateProjectionMatrix();
        }
        invalidate();
    }, [isMobile, camera, invalidate]);

    useFrame(() => {
      if(autoRotate) invalidate()
    });

    return (
        <>
            <color attach="background" args={['#020202']} />
            <StaticStars count={isMobile ? 200 : 500} />
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
                autoRotate={autoRotate}
                autoRotateSpeed={0.3}
                onStart={() => setAutoRotate(false)}
                onEnd={() => setTimeout(() => setAutoRotate(true), 2000)}
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
  const { locale } = useTranslation();
  const dateLocales: { [key: string]: any } = { pt: ptBR, en: enUS, es: es };
  const fnsLocale = dateLocales[locale] || ptBR;

  const dateObj = useMemo(() => {
      if (!card.date) return null;
      const seconds = (card.date as any)._seconds || (card.date as any).seconds;
      return seconds ? new Date(seconds * 1000) : (card.date instanceof Date ? card.date : null);
  }, [card.date]);

  // FIX: Use createPortal to render outside the main react root and set a very high z-index
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300000] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
      onClick={onClose} // Close on backdrop click
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
  const [autoRotate, setAutoRotate] = useState(true);
  const [dpr, setDpr] = useState(1);
  const [starCount, setStarCount] = useState(isMobile ? 200 : 500);

  // Preload first 5 images
  useEffect(() => {
    const urls = events.map(e => e.imageUrl).slice(0, 5);
    urls.forEach(url => {
        const img = new window.Image();
        img.src = url;
    })
  }, [events])

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!mounted || events.length === 0) return null;

  return createPortal(
    <motion.div 
      className="fixed inset-0 z-[200000] bg-[#020202]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <CardProvider events={events}>
        <Canvas
          frameloop="demand"
          dpr={dpr}
          gl={{ 
              antialias: false,
              powerPreference: 'high-performance', 
              stencil: false,
              depth: true
          }}
        >
            <Suspense fallback={null}>
                <PerformanceMonitor
                    onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.5))}
                    onDecline={() => setDpr(0.5)}
                    onFallback={() => {
                        setDpr(0.4);
                        setStarCount(isMobile ? 100 : 200);
                    }}
                 >
                    <Scene isMobile={isMobile} events={events} setSelectedCard={setSelectedCard} autoRotate={autoRotate} setAutoRotate={setAutoRotate} />
                </PerformanceMonitor>
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
