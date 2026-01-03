
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GRID_SIZE = 3;

type Piece = {
  id: number;
  originalIndex: number;
};

type PuzzleProps = {
  imageSrc?: string;
  onReveal?: () => void;
  maxDimension?: number;
};

const Puzzle = ({
  imageSrc,
  onReveal,
  maxDimension = 450,
}: PuzzleProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
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
    
    if (imageSrc) {
      setImageLoaded(false);
      const img = new window.Image();
      img.src = imageSrc;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageSrc, shufflePieces]);

  useEffect(() => {
    if (isComplete && onReveal) {
      const timer = setTimeout(() => onReveal(), 1200); 
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
    <div className="w-full flex flex-col items-center gap-4">
      <div 
        className="w-full aspect-square relative touch-none select-none"
        style={{ maxWidth: maxDimension }}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs text-white/50">Carregando imagem...</p>
          </div>
        )}

        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-xl p-6 text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Desafio Concluído!</h3>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          className={cn(
            "grid gap-1 w-full h-full p-1 bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden",
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
                  backgroundImage: imageLoaded ? `url(${imageSrc})` : 'none',
                  backgroundSize: `${GRID_SIZE * 100}%`,
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
