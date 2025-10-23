"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  OrbitControls,
  Environment,
  Html,
  Plane,
  Sphere,
} from "@react-three/drei"
import { Download, Heart, X } from "lucide-react"

type CardData = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date: Date;
}

type CardContextType = {
  selectedCard: CardData | null
  setSelectedCard: (card: CardData | null) => void
  cards: CardData[]
}

const CardContext = createContext<CardContextType | undefined>(undefined)

function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("useCard must be used within CardProvider")
  return ctx
}

export function CardProvider({ events, children }: { events: any[], children: React.ReactNode }) {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  const cards: CardData[] = useMemo(() => events.map((event, index) => ({
      id: `${index}`,
      imageUrl: event.image?.preview || 'https://picsum.photos/seed/1/600/400',
      alt: event.description,
      title: event.description,
      date: event.date,
  })).sort((a, b) => a.date.getTime() - b.date.getTime()), [events]);

  return (
    <CardContext.Provider value={{ selectedCard, setSelectedCard, cards }}>
      {children}
    </CardContext.Provider>
  )
}

function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    let currentMount = mountRef.current;
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 1) // Black background
    currentMount.appendChild(renderer.domElement)

    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 10000
    const positions = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount; i++) {
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
        if (!currentMount) return;
        camera.aspect = currentMount.clientWidth / currentMount.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)
    }
    
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(currentMount);


    return () => {
      if(currentMount) {
        resizeObserver.unobserve(currentMount);
      }
      cancelAnimationFrame(animationId)
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement)
      }
      renderer.dispose()
      starsGeometry.dispose()
      starsMaterial.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full z-0 bg-black" />
}

function FloatingCard({ card, position }: { card: CardData; position: { x: number; y: number; z: number; rotationX: number; rotationY: number; rotationZ: number } }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedCard } = useCard()

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    setSelectedCard(card)
  }
  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = "pointer"
  }
  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = "auto"
  }

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Plane
        ref={meshRef}
        args={[4.5, 6]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
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
          className="w-40 h-52 rounded-lg overflow-hidden shadow-2xl bg-card p-3 select-none"
          style={{
            boxShadow: hovered
              ? "0 25px 50px hsl(var(--primary) / 0.5), 0 0 30px hsl(var(--primary) / 0.3)"
              : "0 15px 30px rgba(0, 0, 0, 0.6)",
            border: hovered ? "2px solid hsl(var(--primary) / 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <img
            src={card.imageUrl || "/placeholder.svg"}
            alt={card.alt}
            className="w-full h-40 object-cover rounded-md"
            loading="lazy"
            draggable={false}
          />
          <div className="mt-1 text-center">
            <p className="text-card-foreground text-xs font-medium truncate">{card.title}</p>
          </div>
        </div>
      </Html>
    </group>
  )
}

function CardModal() {
  const { selectedCard, setSelectedCard } = useCard()
  const [isFavorited, setIsFavorited] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsFavorited(false);
  }, [selectedCard]);


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
    const link = document.createElement('a');
    link.href = selectedCard.imageUrl;
    link.download = selectedCard.title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="relative max-w-md w-full mx-4">
        <button onClick={handleClose} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10">
          <X className="w-8 h-8" />
        </button>

        <div style={{ perspective: "1000px" }} className="w-full">
          <div
            ref={cardRef}
            className="relative cursor-pointer rounded-[16px] bg-card p-4 transition-all duration-500 ease-out w-full border border-primary/20"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full mb-4 aspect-square">
              <img
                loading="lazy"
                className="absolute inset-0 h-full w-full rounded-lg bg-black object-cover"
                alt={selectedCard.alt}
                src={selectedCard.imageUrl || "/placeholder.svg"}
              />
            </div>
            <p className="text-muted-foreground text-sm mb-2">{selectedCard.date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h3 className="text-card-foreground text-lg font-semibold text-center mb-4">{selectedCard.title}</h3>

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

function CardGalaxy() {
  const { cards } = useCard()

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
    
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < numCards; i++) {
        const y = 1 - (i / (numCards -1)) * 2; 
        const radiusAtY = Math.sqrt(1 - y*y);
        const theta = (2 * Math.PI * i) / goldenRatio;
        
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        
        const layerRadius = 12 + (i % 3) * 4;
        
        positions.push({
            x: x * layerRadius,
            y: y * layerRadius,
            z: z * layerRadius,
            rotationX: Math.atan2(z, Math.sqrt(x * x + y * y)),
            rotationY: Math.atan2(x, z),
            rotationZ: (Math.random() - 0.5) * 0.2,
        });
    }
    return positions;
  }, [cards]);


  if (!cards || cards.length === 0) {
      return null;
  }

  return (
    <>
      <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.15} wireframe />
      </Sphere>
      <Sphere args={[12, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="hsl(var(--primary))" transparent opacity={0.05} wireframe />
      </Sphere>
      <Sphere args={[16, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="hsl(var(--primary))" transparent opacity={0.03} wireframe />
      </Sphere>
      <Sphere args={[20, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="hsl(var(--primary))" transparent opacity={0.02} wireframe />
      </Sphere>

      {cards.map((card, i) => (
        <FloatingCard key={card.id} card={card} position={cardPositions[i]} />
      ))}
    </>
  )
}

function TimelineComponent() {
  const { cards } = useCard()
  if (!cards || cards.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 border border-dashed rounded-lg bg-black/30">
              <p className="text-muted-foreground">Sua Linha do Tempo aparecerá aqui.</p>
              <p className="text-sm text-muted-foreground/50">Adicione momentos na etapa anterior para começar.</p>
          </div>
      );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      <StarfieldBackground />

      <Canvas
        camera={{ position: [0, 0, 35], fov: 60 }}
        className="absolute inset-0 z-10"
        onCreated={({ gl }) => {
          gl.domElement.style.pointerEvents = "auto"
        }}
      >
        <Suspense fallback={null}>
          <Environment preset="night" />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.6} />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          <CardGalaxy />
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={5}
            maxDistance={40}
            autoRotate={true}
            autoRotateSpeed={0.3}
            rotateSpeed={-0.4}
            zoomSpeed={1.2}
            panSpeed={0.8}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>

      <CardModal />

      <div className="absolute top-4 left-4 z-20 text-white pointer-events-none max-w-sm">
        <h1 className="text-xl md:text-2xl font-bold mb-2 font-headline">Nossa Linha do Tempo</h1>
        <p className="text-xs md:text-sm opacity-70">Arraste para girar • Use o scroll para aproximar • Clique nos cards para ver os detalhes</p>
      </div>
    </div>
  )
}


export default function Timeline() {
    return <TimelineComponent />;
}
