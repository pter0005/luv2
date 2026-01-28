
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

  const shufflePieces = useCallback((array: any[]) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    // Garante que não comece resolvido
    const isSolved = newArray.every((p, i) => p.originalIndex === i);
    return isSolved ? shufflePieces(newArray) : newArray;
  }, []);

  useEffect(() => {
    if (!imageSrc) return;

    setImageLoaded(false);
    setIsComplete(false);
    setSelectedPieceIndex(null);

    const img = new Image();
    
    // Função que inicializa o puzzle
    const handleImageLoad = () => {
      const initialPieces = [];
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        initialPieces.push({ id: i, originalIndex: i });
      }
      setPieces(shufflePieces(initialPieces));
      setImageLoaded(true);
    };

    img.onload = handleImageLoad;
    img.onerror = () => {
      console.error("Erro ao carregar imagem.");
      setImageLoaded(false);
    };

    // Importante: Definir o SRC por último para garantir que o onload capture o evento
    img.src = imageSrc;

    // Se a imagem já estiver no cache, o onload pode não disparar em alguns navegadores
    if (img.complete) {
      handleImageLoad();
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
        
        if (newPieces.every((p, i) => p.originalIndex === i)) {
          setIsComplete(true);
        }
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
        {/* Camada de Loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-900">
            <Loader2 className="animate-spin text-white w-10 h-10" />
          </div>
        )}
        
        {/* Overlay de Sucesso */}
        <AnimatePresence>
          {isComplete && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white p-4 rounded-full"
              >
                <CheckCircle className="w-12 h-12 text-green-500" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid do Puzzle */}
        <div 
          className="grid w-full h-full p-1 gap-1 bg-zinc-800" 
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {pieces.map((piece, index) => {
            const col = piece.originalIndex % GRID_SIZE;
            const row = Math.floor(piece.originalIndex / GRID_SIZE);

            // Cálculo perfeito de posição:
            // Para 3 colunas, as posições são 0%, 50% e 100%
            const posX = (col / (GRID_SIZE - 1)) * 100;
            const posY = (row / (GRID_SIZE - 1)) * 100;

            return (
              <motion.div
                key={piece.id}
                layout
                onClick={() => handlePieceClick(index)}
                className={cn(
                  "relative w-full h-full cursor-pointer transition-shadow",
                  selectedPieceIndex === index 
                    ? "z-20 ring-4 ring-yellow-400 scale-[0.95] rounded-lg shadow-2xl" 
                    : "ring-1 ring-white/10 rounded-sm"
                )}
                style={{
                  backgroundImage: imageLoaded ? `url("${imageSrc}")` : 'none',
                  // backgroundSize: 300% para um grid 3x3
                  backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
                  backgroundPosition: `${posX}% ${posY}%`,
                  backgroundRepeat: 'no-repeat',
                }}
                whileHover={{ scale: isComplete ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Puzzle;
