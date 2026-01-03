"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GRID_SIZE = 3;

const Puzzle = ({ imageSrc, onReveal, maxDimension = 450 }: any) => {
  const [containerWidth, setContainerWidth] = useState(maxDimension);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pieces, setPieces] = useState<any[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => setContainerWidth(containerRef.current!.offsetWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const shufflePieces = useCallback((array: any[]) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray.every((p, i) => p.originalIndex === i) ? shufflePieces(newArray) : newArray;
  }, []);

  useEffect(() => {
    const initialPieces = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) initialPieces.push({ id: i, originalIndex: i });
    setPieces(shufflePieces(initialPieces));
    
    if (imageSrc) {
      const img = new window.Image();
      img.src = imageSrc;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageSrc, shufflePieces]);

  // REVELAÇÃO AUTOMÁTICA
  useEffect(() => {
    if (isComplete && onReveal) {
      console.log("PUZZLE: Sucesso! Chamando onReveal em 1.2s...");
      const timer = setTimeout(() => {
        onReveal(); 
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onReveal]);

  const handlePieceClick = (clickedIndex: number) => {
    if (!imageLoaded || isComplete) return;
    
    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(clickedIndex);
    } else {
      if (selectedPieceIndex !== clickedIndex) {
        const newPieces = [...pieces];
        [newPieces[selectedPieceIndex], newPieces[clickedIndex]] = [newPieces[clickedIndex], newPieces[selectedPieceIndex]];
        setPieces(newPieces);
        
        if (newPieces.every((p, i) => p.originalIndex === i)) {
          setIsComplete(true);
        }
      }
      setSelectedPieceIndex(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center" ref={containerRef}>
      <div className="w-full aspect-square relative touch-none select-none" style={{ maxWidth: maxDimension }}>
        {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-xl">
                <Loader2 className="animate-spin text-primary" />
            </div>
        )}
        
        <AnimatePresence>
          {isComplete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-xl">
              <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
              <p className="text-white font-bold">Desafio Concluído!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-1 w-full h-full p-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {pieces.map((piece, index) => {
            const posX = (piece.originalIndex % GRID_SIZE / (GRID_SIZE - 1)) * 100;
            const posY = (Math.floor(piece.originalIndex / GRID_SIZE) / (GRID_SIZE - 1)) * 100;
            return (
              <motion.div
                key={piece.id}
                layout
                onClick={() => handlePieceClick(index)}
                className={cn(
                    "relative rounded-sm cursor-pointer transition-all", 
                    selectedPieceIndex === index ? "ring-4 ring-primary z-20 scale-105" : "ring-1 ring-white/5"
                )}
                style={{
                  backgroundImage: imageLoaded ? `url("${imageSrc}")` : 'none',
                  backgroundSize: '300%',
                  backgroundPosition: `${posX}% ${posY}%`,
                  backgroundColor: '#18181b'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Puzzle;
