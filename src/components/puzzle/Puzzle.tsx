"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Shuffle, CheckCircle, Loader2 } from "lucide-react";
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
  
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Monitora o tamanho real da tela
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

  // 2. Função para embaralhar
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

  // 3. Inicializa o quebra-cabeça e carrega a imagem
  useEffect(() => {
    const initialPieces: Piece[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      initialPieces.push({ id: i, originalIndex: i });
    }
    setPieces(shufflePieces(initialPieces));
    
    if (initialImageSrc) {
      setImageLoaded(false); // Reseta o estado de carregamento
      const img = new window.Image();
      img.src = initialImageSrc;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => {
          console.error("Falha ao carregar imagem do quebra-cabeça");
          setImageLoaded(false); // Mantém como não carregado em caso de erro
      }
    } else {
        setImageLoaded(false);
    }
  }, [initialImageSrc, shufflePieces]);

  const handlePieceClick = (clickedIndex: number) => {
    if (!imageLoaded) return;

    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(clickedIndex);
    } else {
      if (selectedPieceIndex !== clickedIndex) {
        const newPieces = [...pieces];
        [newPieces[selectedPieceIndex], newPieces[clickedIndex]] = [newPieces[clickedIndex], newPieces[selectedPieceIndex]];
        setPieces(newPieces);
        
        // Verifica a solução e chama o onReveal AUTOMATICAMENTE
        const solved = newPieces.every((p, i) => p.originalIndex === i);
        if (solved && onReveal) {
          // Pequeno delay para o usuário ver a última peça se encaixando
          setTimeout(() => {
            onReveal();
          }, 300);
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
        {/* Camada de Carregamento */}
        {!imageLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/20 backdrop-blur-md rounded-xl border border-white/10">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Preparando desafio...</p>
          </div>
        )}

        {/* O GRID */}
        <div 
          className="grid gap-1 w-full h-full p-1 bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
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
      </div>
    </div>
  );
};

export default Puzzle;
