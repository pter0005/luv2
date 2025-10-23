"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
  OrbitControls,
  Environment,
  Html,
  Plane,
  Box,
} from "@react-three/drei"
import { X } from "lucide-react"

type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date: Date;
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

export function CardProvider({ events, children }: { events: any[], children: React.ReactNode }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const cards: Card[] = useMemo(() => events.map((event, index) => ({
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
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    
    let currentMount = mountRef.current;
    
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0) // Transparent background
    currentMount.appendChild(renderer.domElement)

    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 5000
    const positions = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true })
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
    window.addEventListener("resize", handleResize)
    
    // Initial resize
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement)
      }
      renderer.dispose()
      starsGeometry.dispose()
      starsMaterial.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full z-0" />
}

function FloatingCard({ card, position }: { card: Card; position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { setSelectedCard } = useCard();

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedCard(card);
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef} position={position}>
      <Plane
        args={[4, 5.33]} // 4:3 aspect ratio
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
          transform: hovered ? "scale(1.1)" : "scale(1)",
          pointerEvents: "none",
        }}
      >
        <div
          className="w-[180px] h-[240px] rounded-lg overflow-hidden shadow-2xl bg-card/80 p-2 select-none backdrop-blur-sm"
          style={{
            boxShadow: hovered
              ? "0 25px 50px rgba(140, 92, 246, 0.4), 0 0 30px rgba(140, 92, 246, 0.2)"
              : "0 15px 30px rgba(0, 0, 0, 0.6)",
            border: hovered ? "2px solid rgba(140, 92, 246, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <img
            src={card.imageUrl || "/placeholder.svg"}
            alt={card.alt}
            className="w-full h-40 object-cover rounded-md"
            loading="lazy"
            draggable={false}
          />
          <div className="mt-2 text-center p-1">
            <p className="text-white text-xs font-semibold truncate">{card.title}</p>
            <p className="text-muted-foreground text-[10px]">{card.date.toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </Html>
    </group>
  );
}


function CardModal() {
  const { selectedCard, setSelectedCard } = useCard()
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

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s ease-out"
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
    }
  }

  const handleClose = () => setSelectedCard(null)
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleBackdropClick}>
      <div className="relative max-w-sm w-full mx-4">
        <button onClick={handleClose} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10">
          <X className="w-8 h-8" />
        </button>

        <div style={{ perspective: "1000px" }} className="w-full">
          <div
            ref={cardRef}
            className="relative cursor-pointer rounded-2xl bg-card/90 p-4 transition-all duration-500 ease-out w-full border border-primary/20"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full mb-4" style={{ aspectRatio: "4 / 3" }}>
              <img
                loading="lazy"
                className="absolute inset-0 h-full w-full rounded-lg bg-black object-cover"
                alt={selectedCard.alt}
                src={selectedCard.imageUrl || "/placeholder.svg"}
              />
            </div>
            <p className="text-muted-foreground text-sm mb-2">{selectedCard.date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h3 className="text-white text-lg font-semibold text-center">{selectedCard.title}</h3>
          </div>
        </div>
      </div>
    </div>
  )
}

const Room = () => {
    const { cards } = useCard();
    const roomSize = 30;
    
    const cardPositions = useMemo(() => {
        const positions: [number, number, number][] = [];
        const numCards = cards.length;
        if (numCards === 0) return [];
        
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleIncrement = Math.PI * 2 * goldenRatio;

        for (let i = 0; i < numCards; i++) {
            const y = 1 - (i / (numCards -1)) * 2; 
            const radius = Math.sqrt(1 - y*y);
            const theta = angleIncrement * i;
            
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            
            const sphereRadius = 10;
            
            positions.push([x * sphereRadius, y * sphereRadius, z * sphereRadius]);
        }
        return positions;
    }, [cards]);

    return (
        <>
            <Box args={[roomSize, roomSize, roomSize]} visible={false}>
                <meshStandardMaterial side={THREE.BackSide} />
            </Box>
<<<<<<< HEAD
            {cards.map((card, i) => {
                const position = cardPositions[i] || [0,0,0];
                return (
                 <FloatingCard key={card.id} card={card} position={position} />
=======
            {cardPositions.map((data, i) => {
                return (
                 <FloatingCard key={data.card.id} card={data.card} position={data.position} rotation={data.rotation} />
>>>>>>> 5813f7f (funcionou, mas n tem o fundo de universo, e n ta com uma sensação de 360)
                )
            })}
        </>
    );
};


export default function Timeline() {
  const { cards } = useCard();
  if (!cards || cards.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border border-dashed rounded-lg bg-black/30">
            <p className="text-muted-foreground">Sua Linha do Tempo aparecerá aqui.</p>
            <p className="text-sm text-muted-foreground/50">Adicione momentos na etapa anterior para começar.</p>
        </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
        <StarfieldBackground />
        <Canvas
            camera={{ position: [0, 0, 25], fov: 75 }}
            className="absolute inset-0 z-10"
        >
            <Suspense fallback={null}>
                <Environment preset="night" />
                <ambientLight intensity={0.8} />
                <pointLight position={[0, 15, 0]} intensity={1} />
                <Room />
                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    enableRotate
                    minDistance={5}
                    maxDistance={35}
                    autoRotate={true}
                    autoRotateSpeed={0.3}
                    rotateSpeed={-0.4} // Invert rotation direction
                    target={[0, 0, 0]}
                />
            </Suspense>
        </Canvas>
        <CardModal />
    </div>
  )
}
