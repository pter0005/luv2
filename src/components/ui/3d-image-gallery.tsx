
"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  OrbitControls,
  Html,
  Plane,
  Sphere,
} from "@react-three/drei"
import { Download, Heart, Smartphone, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"


/* =========================
   Orientation Hook
   ========================= */

function useScreenOrientation() {
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDeviceAndOrientation = () => {
            const isMobileDevice = /Mobi/i.test(window.navigator.userAgent);
            setIsMobile(isMobileDevice);

            if (window.screen.orientation) {
                setOrientation(window.screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape');
            } else {
                setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
            }
        };

        const handleOrientationChange = () => {
             if (window.screen.orientation) {
                setOrientation(window.screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape');
            } else {
                setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
            }
        };

        checkDeviceAndOrientation();
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);


        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', handleOrientationChange);
        };
    }, []);

    return { orientation, isMobile };
}

/* =========================
   Rotate Screen Overlay
   ========================= */

function RotateDeviceOverlay() {
    const { orientation, isMobile } = useScreenOrientation();
    
    if (!isMobile || orientation === 'landscape') {
        return null;
    }

    return (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white text-center p-4">
            <Smartphone className="w-16 h-16 mb-4 animate-pulse" />
            <h2 className="text-xl font-bold">Vire o seu dispositivo</h2>
            <p className="text-muted-foreground">Para uma melhor experiência, por favor, gire a tela para o modo paisagem.</p>
        </div>
    );
}

/* =========================
   Card Context
   ========================= */

type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date?: Date
}

type CardContextType = {
  selectedCard: Card | null
  setSelectedCard: (card: Card | null) => void
  cards: Card[]
}

const CardContext = createContext<CardContextType | undefined>(undefined)

function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("useCard must be used within CardProvider")
  return ctx
}

export function CardProvider({ children, events }: { children: React.ReactNode, events: any[] }) {
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);

    const cards = useMemo(() => {
        if (!events) return [];
        return events
            .filter(event => event.image && event.image.preview)
            .map((event, index) => ({
                id: index.toString(),
                imageUrl: event.image.preview,
                alt: event.description,
                title: event.description,
                date: event.date
            }));
    }, [events]);


  return (
    <CardContext.Provider value={{ selectedCard, setSelectedCard, cards }}>
      {children}
    </CardContext.Provider>
  )
}

/* =========================
   Starfield Background
   ========================= */

function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!mountRef.current || !isClient) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 1)
    mountRef.current.appendChild(renderer.domElement)

    const starsGeometry = new THREE.BufferGeometry()
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 2000 : 10000;
    
    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    camera.position.z = 10

    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      stars.rotation.y += 0.0001
      stars.rotation.x += 0.00005
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      starsGeometry.dispose()
      starsMaterial.dispose()
    }
  }, [isClient])

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 bg-black" />
}

/* =========================
   Floating Card
   ========================= */

function FloatingCard({
  card,
  position,
}: {
  card: Card
  position: { x: number; y: number; z: number; rotationX: number; rotationY: number; rotationZ: number }
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedCard } = useCard()
  const vec = new THREE.Vector3()

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
      if (hovered) {
        groupRef.current.position.lerp(vec.set(position.x, position.y, position.z + 1), 0.1)
      } else {
        groupRef.current.position.lerp(vec.set(position.x, position.y, position.z), 0.1)
      }
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    setSelectedCard(card)
  }

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = "auto"
      }}
      onClick={handleClick}
    >
      <Plane args={[6, 8.1]}>
        <meshBasicMaterial transparent opacity={0} />
      </Plane>
      <Html
        transform
        distanceFactor={10}
        position={[0, 0, 0.01]}
        style={{
          transition: "all 0.3s ease",
          transform: hovered ? "scale(1.15)" : "scale(1)",
          pointerEvents: "none",
        }}
      >
        <div
          className="w-52 h-72 rounded-lg overflow-hidden shadow-2xl bg-[#1F2121] p-2 select-none flex flex-col"
          style={{
            boxShadow: hovered
              ? "0 25px 50px hsl(var(--primary) / 0.5), 0 0 30px hsl(var(--primary) / 0.3)"
              : "0 15px 30px rgba(0, 0, 0, 0.6)",
            border: hovered ? "2px solid hsl(var(--primary) / 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="w-full h-52 relative">
            <Image
              src={card.imageUrl || "/placeholder.svg"}
              alt={card.alt}
              fill
              className="object-cover rounded-md"
              unoptimized
            />
          </div>
          <div className="mt-1 text-center flex-grow flex flex-col justify-center px-1">
            <p className="text-white text-sm font-semibold leading-tight line-clamp-3" style={{ textRendering: 'optimizeLegibility', transform: 'translateZ(0)' }}>{card.title}</p>
             {card.date && (
              <p className="text-primary/90 text-xs font-bold mt-2 tracking-wide" style={{ textRendering: 'optimizeLegibility', transform: 'translateZ(0)' }}>
                {format(card.date, "dd MMM yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      </Html>
    </group>
  )
}

/* =========================
   Card Modal
   ========================= */

function CardModal() {
  const { selectedCard, setSelectedCard } = useCard()
  const [isFavorited, setIsFavorited] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  if (!selectedCard) return null

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 15
    const rotateY = (centerX - x) / 15
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleMouseEnter = () => {}
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s ease-out"
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
    }
  }

  const toggleFavorite = () => setIsFavorited((v) => !v)
  const handleClose = () => setSelectedCard(null)
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }
  
  const handleDownload = () => {
    if (selectedCard) {
      const link = document.createElement('a');
      link.href = selectedCard.imageUrl;
      link.download = selectedCard.title || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="relative max-w-sm w-full mx-4 md:max-w-md">
        <button onClick={handleClose} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10">
          <X className="w-8 h-8" />
        </button>

        <div style={{ perspective: "1000px" }} className="w-full">
          <div
            ref={cardRef}
            className="relative cursor-pointer rounded-[16px] bg-[#1F2121] p-4 transition-all duration-500 ease-out w-full"
            style={{
              transformStyle: "preserve-3d",
              boxShadow:
                "rgba(0, 0, 0, 0.01) 0px 520px 146px 0px, rgba(0, 0, 0, 0.04) 0px 333px 133px 0px, rgba(0, 0, 0, 0.26) 0px 83px 83px 0px, rgba(0, 0, 0, 0.29) 0px 21px 46px 0px",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full mb-4" style={{ aspectRatio: "3 / 4" }}>
              <Image
                className="absolute inset-0 h-full w-full rounded-[16px] bg-[#000000] object-cover"
                alt={selectedCard.alt}
                src={selectedCard.imageUrl || "/placeholder.svg"}
                fill
                style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px", opacity: 1 }}
                unoptimized
              />
            </div>

            <h3 className="text-white text-lg font-semibold mb-2 text-center">{selectedCard.title}</h3>
            {selectedCard.date && (
                <p className="text-primary/80 text-base font-bold mb-4 text-center tracking-wide" style={{ textRendering: 'optimizeLegibility' }}>
                    {format(selectedCard.date, "PPP", { locale: ptBR })}
                </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg text-base font-medium text-primary-foreground bg-primary outline-none transition duration-300 ease-out hover:opacity-80 active:scale-[0.97]"
              >
                <div className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" strokeWidth={1.8} />
                  <span>Download</span>
                </div>
              </button>
              <button
                type="button"
                onClick={toggleFavorite}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground bg-primary outline-none transition duration-300 ease-out hover:opacity-80 active:scale-[0.97]"
              >
                <Heart className="h-4 w-4" strokeWidth={1.8} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================
   Card Galaxy
   ========================= */

function CardGalaxy() {
  const { cards } = useCard()
  const { isMobile } = useScreenOrientation();

  const cardPositions = useMemo(() => {
    const positions: {
        x: number
        y: number
        z: number
        rotationX: number
        rotationY: number
        rotationZ: number
    }[] = []
    const numCards = cards.length;
    if (numCards === 0) return [];
    
    // Handle the case for a single card to avoid division by zero
    if (numCards === 1) {
        positions.push({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 });
        return positions;
    }

    const goldenRatio = (1 + Math.sqrt(5)) / 2
    const baseRadius = isMobile ? 8 : 12;

    for (let i = 0; i < numCards; i++) {
        const y = 1 - (i / (numCards - 1)) * 2 // y goes from 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y) // radius at y
        const theta = (2 * Math.PI * i) / goldenRatio
        const x = Math.cos(theta) * radiusAtY
        const z = Math.sin(theta) * radiusAtY
        
        // Distribute cards across multiple layers
        const layerRadius = baseRadius + (i % (isMobile ? 2 : 3)) * (isMobile ? 3 : 4);

        positions.push({
            x: x * layerRadius,
            y: y * layerRadius,
            z: z * layerRadius,
            rotationX: Math.atan2(z, Math.sqrt(x * x + y * y)),
            rotationY: Math.atan2(x, z),
            rotationZ: (Math.random() - 0.5) * 0.2,
        })
    }
    return positions
}, [cards, isMobile])

  return (
    <>
      <Sphere args={[2, isMobile ? 16 : 32, isMobile ? 16 : 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0} wireframe />
      </Sphere>
      <Sphere args={[12, isMobile ? 16 : 32, isMobile ? 16 : 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="hsl(var(--primary))" transparent opacity={0} wireframe />
      </Sphere>
      <Sphere args={[16, isMobile ? 16 : 32, isMobile ? 16 : 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="hsl(var(--primary))" transparent opacity={0} wireframe />
      </Sphere>
      <Sphere args={[20, isMobile ? 16 : 32, isMobile ? 16 : 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="hsl(var(--primary))" transparent opacity={0} wireframe />
      </Sphere>

      {cards.map((card, i) => (
        cardPositions[i] && <FloatingCard key={card.id} card={card} position={cardPositions[i]} />
      ))}
    </>
  )
}

/* =========================
   Page/Component Export
   ========================= */

export default function StellarCardGallerySingle({ onClose }: { onClose: () => void }) {
  const { cards } = useCard();
  const { isMobile } = useScreenOrientation();
  
  if (!cards || cards.length === 0) {
      return (
          <div className="w-full h-screen fixed inset-0 z-50 bg-black flex items-center justify-center text-white">
              Nenhum momento adicionado.
          </div>
      )
  }
  
  return (
      <div className="w-full h-screen fixed inset-0 z-50 bg-black">
        <RotateDeviceOverlay />
        <StarfieldBackground />

        <Canvas
          camera={{ position: [0, 0, isMobile ? 40 : 30], fov: 60 }}
          className="absolute inset-0 z-10"
          onCreated={({ gl }) => {
            gl.domElement.style.pointerEvents = "auto"
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            <CardGalaxy />
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={isMobile ? 15 : 5}
              maxDistance={isMobile ? 50 : 40}
              autoRotate={isMobile && cards.length > 1}
              autoRotateSpeed={0.3}
              rotateSpeed={isMobile ? 1.2 : 0.5}
              zoomSpeed={isMobile ? 1.5 : 1.2}
              panSpeed={isMobile ? 1.5 : 0.8}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        <CardModal />

        <div className="absolute top-4 left-4 z-20 text-white pointer-events-none max-w-xs md:max-w-sm">
          <h1 className="text-xl md:text-2xl font-bold mb-2">Nossa Linha do Tempo</h1>
          <p className="text-xs md:text-sm opacity-70">Arraste para girar • Use o scroll para zoom • Clique nos cards para ver detalhes</p>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors">
            <X className="w-6 h-6" />
        </button>
      </div>
  )
}
