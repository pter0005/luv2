
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Shuffle, CheckCircle } from "lucide-react";
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
  const [imageSrc, setImageSrc] = useState(initialImageSrc || "");
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) setContainerWidth(width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const pieceSize = containerWidth / GRID_SIZE;

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

  const initPuzzle = useCallback((src: string) => {
    if (!src) return;
    const newPieces: Piece[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      newPieces.push({ id: i, originalIndex: i });
    }
    setPieces(shufflePieces(newPieces));
    setIsComplete(false);
    setIsRevealed(false);
    setSelectedPieceIndex(null);
  }, [shufflePieces]);

  useEffect(() => {
    // Only initialize or update if the initialImageSrc is valid
    if (initialImageSrc) {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.src = initialImageSrc;
      img.onload = () => {
        setImageSrc(initialImageSrc);
        initPuzzle(initialImageSrc);
      };
      img.onerror = () => {
        // Handle potential image loading errors if necessary,
        // but don't default to a placeholder.
        console.error("Failed to load puzzle image:", initialImageSrc);
      };
    } else {
        // If no image is provided (especially on initial load with controls),
        // we can set a default or leave it blank.
        const defaultSrc = `https://picsum.photos/seed/love/600/600`;
        if (showControls) {
            setImageSrc(defaultSrc);
            initPuzzle(defaultSrc);
        }
    }
  }, [initialImageSrc, initPuzzle, showControls]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newSrc = event.target?.result as string;
        setImageSrc(newSrc);
        initPuzzle(newSrc);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePieceClick = (clickedIndex: number) => {
    if (isComplete || isRevealed) return;

    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(clickedIndex);
    } else {
      if (selectedPieceIndex !== clickedIndex) {
        const newPieces = [...pieces];
        [newPieces[selectedPieceIndex], newPieces[clickedIndex]] = [newPieces[clickedIndex], newPieces[selectedPieceIndex]];
        setPieces(newPieces);
        
        const solved = newPieces.every((p, i) => p.originalIndex === i);
        if (solved) setIsComplete(true);
      }
      setSelectedPieceIndex(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-full px-2" ref={containerRef}>
      <div 
        className="w-full aspect-square relative touch-none select-none"
        style={{ maxWidth: maxDimension }}
      >
        <AnimatePresence>
          {isComplete && !isRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 rounded-xl p-4 text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Incrível!</h3>
              <p className="text-white/80 mb-6">Você completou o desafio.</p>
              <Button onClick={() => onReveal ? onReveal() : setIsRevealed(true)} size="lg" className="w-full sm:w-auto">
                Revelar Surpresa
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          className="grid gap-1 w-full h-full p-1 bg-card/20 backdrop-blur-sm border border-white/10 rounded-xl"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {pieces.map((piece, index) => {
            const row = Math.floor(piece.originalIndex / GRID_SIZE);
            const col = piece.originalIndex % GRID_SIZE;
            
            return (
              <motion.div
                key={piece.id}
                layout
                onClick={() => handlePieceClick(index)}
                className={cn(
                  "relative rounded-lg overflow-hidden cursor-pointer active:scale-95 transition-transform",
                  selectedPieceIndex === index ? "ring-4 ring-primary z-10 shadow-2xl scale-105" : "ring-1 ring-white/20"
                )}
                style={{
                  aspectRatio: "1/1",
                  backgroundImage: `url(${imageSrc})`,
                  backgroundSize: `${containerWidth}px ${containerWidth}px`,
                  backgroundPosition: `-${col * (containerWidth / GRID_SIZE)}px -${row * (containerWidth / GRID_SIZE)}px`,
                }}
                whileTap={{ scale: 0.95 }}
              />
            );
          })}
        </div>
      </div>

      {showControls && (
        <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="bg-background/50">
            <Upload className="w-4 h-4 mr-2" /> Foto Personalizada
          </Button>
          <Button onClick={() => initPuzzle(imageSrc)} variant="ghost" size="sm">
            <Shuffle className="w-4 h-4 mr-2" /> Embaralhar
          </Button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default Puzzle;

    