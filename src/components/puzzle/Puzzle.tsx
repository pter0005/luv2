
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
  const containerRef = useRef<HTMLDivElement>(null);

  const shufflePieces = useCallback((array: Piece[]) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    // Garante que não comece resolvido
    return newArray.every((p, i) => p.originalIndex === i) ? shufflePieces(newArray) : newArray;
  }, []);

  // Inicializa e embaralha as peças quando a imagem muda
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

  // EFEITO COLATERAL PARA REVELAÇÃO AUTOMÁTICA
  useEffect(() => {
    // Se o jogo está completo E a função onReveal existe...
    if (isComplete && onReveal) {
      // Cria um timer para chamar a revelação após uma pequena pausa
      const timer = setTimeout(() => {
        console.log("PUZZLE: Sucesso! Chamando onReveal agora...");
        onReveal(); 
      }, 1200); // 1.2 segundos de pausa para o usuário ver a tela de sucesso
      
      // Limpa o timer se o componente for desmontado
      return () => clearTimeout(timer);
    }
  }, [isComplete, onReveal]); // Este efeito roda sempre que 'isComplete' ou 'onReveal' mudam

  const handlePieceClick = (clickedIndex: number) => {
    // Bloqueia cliques se a imagem não carregou ou se o jogo já terminou
    if (!imageLoaded || isComplete) return;

    if (selectedPieceIndex === null) {
      // Seleciona a primeira peça
      setSelectedPieceIndex(clickedIndex);
    } else {
      // Se a segunda peça for clicada
      if (selectedPieceIndex !== clickedIndex) {
        const newPieces = [...pieces];
        // Troca as peças de lugar
        [newPieces[selectedPieceIndex], newPieces[clickedIndex]] = [newPieces[clickedIndex], newPieces[selectedPieceIndex]];
        setPieces(newPieces);
        
        // Verifica se o quebra-cabeça foi resolvido
        if (newPieces.every((p, i) => p.originalIndex === i)) {
            setIsComplete(true); // Ativa o estado de conclusão
        }
      }
      // Reseta a seleção
      setSelectedPieceIndex(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center" ref={containerRef}>
      <div className="w-full aspect-square relative touch-none select-none" style={{ maxWidth: maxDimension }}>
        
        {!imageLoaded && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-900/80 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-white/50 mt-2">Carregando imagem...</p>
            </div>
        )}
        
        {/* TELA DE SUCESSO */}
        <AnimatePresence>
          {isComplete && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mb-2" />
              <p className="text-white font-bold text-lg">Desafio Concluído!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRID DO JOGO */}
        <div className="grid gap-1 w-full h-full p-1 bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {pieces.map((piece, index) => {
            const posX = (piece.originalIndex % GRID_SIZE / (GRID_SIZE - 1)) * 100;
            const posY = (Math.floor(piece.originalIndex / GRID_SIZE) / (GRID_SIZE - 1)) * 100;
            return (
              <motion.div
                key={piece.id}
                layout
                onClick={() => handlePieceClick(index)}
                className={cn(
                  "relative rounded-sm cursor-pointer transition-all duration-200", 
                  selectedPieceIndex === index ? "ring-4 ring-primary z-20 scale-105 shadow-lg" : "ring-1 ring-white/10"
                )}
                style={{
                  backgroundImage: imageLoaded ? `url("${imageSrc}")` : 'none',
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
