"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GRID_SIZE = 3;

const Puzzle = ({ imageSrc, onReveal, maxDimension = 450 }: any) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pieces, setPieces] = useState<any[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Função para embaralhar garantindo que não comece resolvido
  const shufflePieces = useCallback((array: any[]) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    const isSolved = newArray.every((p, i) => p.originalIndex === i);
    return isSolved ? shufflePieces(newArray) : newArray;
  }, []);

  useEffect(() => {
    if (imageSrc) {
      setImageLoaded(false);
      setIsComplete(false);
      
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      
      img.onload = () => {
        const initialPieces = [];
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
          initialPieces.push({ id: i, originalIndex: i });
        }
        setPieces(shufflePieces(initialPieces));
        setImageLoaded(true);
      };

      img.onerror = () => {
        console.error("Erro ao carregar imagem do puzzle.");
        setImageLoaded(false);
      };
    }
  }, [imageSrc, shufflePieces]);

  useEffect(() => {
    if (isComplete && onReveal) {
      const timer = setTimeout(() => onReveal(), 800);
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
        [newPieces[selectedPieceIndex], newPieces[clickedIndex]] = [
          newPieces[clickedIndex],
          newPieces[selectedPieceIndex],
        ];
        setPieces(newPieces);
        
        // Verifica se completou
        const solved = newPieces.every((p, i) => p.originalIndex === i);
        if (solved) setIsComplete(true);
      }
      setSelectedPieceIndex(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center" ref={containerRef}>
      <div 
        className="w-full aspect-square relative touch-none select-none bg-zinc-900 rounded-xl overflow-hidden shadow-2xl" 
        style={{ maxWidth: maxDimension }}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
            <Loader2 className="animate-spin text-white w-8 h-8" />
          </div>
        )}
        
        <AnimatePresence>
          {isComplete && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle className="w-20 h-20 text-green-500 bg-white rounded-full" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid w-full h-full p-1 gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {pieces.map((piece, index) => {
            // Cálculo da posição da fatia da imagem
            const col = piece.originalIndex % GRID_SIZE;
            const row = Math.floor(piece.originalIndex / GRID_SIZE);

            // Em CSS, para grids, o background-size de 300% (GRID_SIZE * 100)
            // e background-position usando porcentagens relativas (0, 50, 100)
            // garante o recorte perfeito independente da resolução da imagem original.
            const posX = (col / (GRID_SIZE - 1)) * 100;
            const posY = (row / (GRID_SIZE - 1)) * 100;

            return (
              <motion.div
                key={piece.id}
                layout
                onClick={() => handlePieceClick(index)}
                className={cn(
                  "relative w-full h-full cursor-pointer overflow-hidden border border-white/10",
                  selectedPieceIndex === index ? "ring-4 ring-blue-500 z-20 scale-[0.98] rounded-md" : "rounded-sm"
                )}
                style={{
                  backgroundImage: imageLoaded ? `url("${imageSrc}")` : 'none',
                  backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
                  backgroundPosition: `${posX}% ${posY}%`,
                  backgroundRepeat: 'no-repeat',
                }}
                whileHover={{ scale: isComplete ? 1 : 1.02 }}
                whileTap={{ scale: 0.95 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Puzzle;
