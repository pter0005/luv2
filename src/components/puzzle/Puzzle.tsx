"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle, CheckCircle, Loader2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GRID_SIZE = 3;

type Piece = {
  id: number;
  originalIndex: number;
};

type PuzzleProps = {
  imageSrc?: string;
  showControls?: boolean;
  onReveal?: () => void;
  maxDimension?: number;
};

const Puzzle = ({
  imageSrc: initialImageSrc,
  showControls = true,
  onReveal,
  maxDimension = 450,
}: PuzzleProps) => {
  const [containerWidth, setContainerWidth] = useState(maxDimension);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width > 0 ? width : maxDimension);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [maxDimension]);

  const shufflePieces = useCallback((array: Piece[]) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    if (newArray.every((p, i) => p.originalIndex === i)) {
      return shufflePieces(newArray);
    }
    return newArray;
  }, []);

  useEffect(() => {
    const initialPieces: Piece[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      initialPieces.push({ id: i, originalIndex: i });
    }
    setPieces(shufflePieces(initialPieces));
    
    if (initialImageSrc) {
      setImageLoaded(false);
      const img = new window.Image();
      img.src = initialImageSrc;
      img.onload = () => setImageLoaded(true);
    }
  }, [initialImageSrc, shufflePieces]);
  
  useEffect(() => {
    // Quando o quebra-cabeça é completo, chama a função onReveal
    if (isComplete && onReveal) {
      const timer = setTimeout(() => {
        onReveal();
      }, 500); // Um pequeno delay para o usuário ver que completou
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
        
        const solved = newPieces.every((p, i) => p.originalIndex === i);
        if (solved) {
          setIsComplete(true);
        }
      }
      setSelectedPieceIndex(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-full" ref={containerRef}>
      <div 
        className="w-full aspect-square relative touch-none select-none"
        style={{ maxWidth: maxDimension }}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs text-white/50">Carregando foto...</p>
          </div>
        )}

        <div 
          className={cn(
            "grid gap-1 w-full h-full p-1 bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-opacity duration-500",
            isComplete && "opacity-40"
          )}
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {pieces.map((piece, index) => {
            const row = Math.floor(piece.originalIndex / GRID_SIZE);
            const col = piece.originalIndex % GRID_SIZE;
            const posX = (col / (GRID_SIZE - 1)) * 100;
            const posY = (row / (GRID_SIZE - 1)) * 100;

            return (
              <motion.div
                key={piece.id}
                layout
                onClick={() => handlePieceClick(index)}
                className={cn(
                  "relative rounded-sm cursor-pointer transition-all duration-200",
                  selectedPieceIndex === index ? "ring-4 ring-primary z-20 scale-105 shadow-2xl" : "ring-1 ring-white/5"
                )}
                style={{
                  backgroundImage: imageLoaded ? `url(${initialImageSrc})` : 'none',
                  backgroundSize: `${GRID_SIZE * 100}%`,
                  backgroundPosition: `${posX}% ${posY}%`,
                  backgroundColor: '#18181b'
                }}
              />
            );
          })}
        </div>
        
        <AnimatePresence>
            {isComplete && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute inset-0 z-30 flex items-center justify-center"
                 >
                    <CheckCircle className="w-24 h-24 text-green-500/80 drop-shadow-[0_0_15px_rgba(50,255,50,0.5)]" />
                 </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Puzzle;
