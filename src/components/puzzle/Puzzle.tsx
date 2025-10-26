"use client";
import { useState, useRef, useEffect, useCallback, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Shuffle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GRID_SIZE = 3;

type Piece = {
  id: number;
  originalIndex: number;
  style: React.CSSProperties;
};

type PuzzleProps = {
  imageSrc?: string;
  showControls?: boolean;
  onReveal?: () => void;
  dimension?: number;
};

const Puzzle = ({
  imageSrc: initialImageSrc,
  showControls = true,
  onReveal,
  dimension: initialDimension = 450,
}: PuzzleProps) => {
  const [dimension, setDimension] = useState(initialDimension);
  const [imageSrc, setImageSrc] = useState(
    initialImageSrc || `https://picsum.photos/seed/puzzle/${dimension}/${dimension}`
  );
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const dragPiece = useRef<number | null>(null);
  const dragOverPiece = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDimension(initialDimension);
  }, [initialDimension]);

  const pieceSize = dimension / GRID_SIZE;

  const shufflePieces = useCallback((array: Piece[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const createAndShufflePieces = useCallback(
    (src: string) => {
      if (!src) return;
      const newPieces: Piece[] = [];
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        newPieces.push({
          id: i,
          originalIndex: i,
          style: {
            backgroundImage: `url(${src})`,
            backgroundSize: `${dimension}px ${dimension}px`,
            backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
            width: `${pieceSize}px`,
            height: `${pieceSize}px`,
          },
        });
      }
      setPieces(shufflePieces(newPieces));
      setIsComplete(false);
      setIsRevealed(false);
    },
    [pieceSize, shufflePieces, dimension]
  );

  useEffect(() => {
    if (initialImageSrc) {
      setImageSrc(initialImageSrc);
    }
    createAndShufflePieces(imageSrc);
  }, [initialImageSrc, createAndShufflePieces, imageSrc]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newSrc = event.target.result as string;
          setImageSrc(newSrc);
          createAndShufflePieces(newSrc);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const checkCompletion = useCallback((currentPieces: Piece[]) => {
    if (currentPieces.length === 0) return;
    const isSolved = currentPieces.every((p, i) => p.originalIndex === i);
    if (isSolved) {
      setIsComplete(true);
    }
  }, []);
  
  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    dragPiece.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setTimeout(() => {
        (e.target as HTMLDivElement).style.opacity = '0.5';
    }, 0);
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    dragOverPiece.current = index;
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    (e.target as HTMLDivElement).style.opacity = '1';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragPiece.current === null || dragOverPiece.current === null) return;
    
    const newPieces = [...pieces];
    const draggedPieceContent = newPieces[dragPiece.current];
    newPieces[dragPiece.current] = newPieces[dragOverPiece.current];
    newPieces[dragOverPiece.current] = draggedPieceContent;
    
    setPieces(newPieces);
    checkCompletion(newPieces);

    dragPiece.current = null;
    dragOverPiece.current = null;
  };
  
  const handleReset = () => {
    createAndShufflePieces(imageSrc);
  };
  
  const handleRevealClick = () => {
      setIsRevealed(true);
      if(onReveal) {
          setTimeout(onReveal, 300); // give it time to animate out
      }
  }

  if (isRevealed && !showControls) {
      return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full" ref={containerRef}>
      <div 
        className="w-full aspect-square bg-transparent rounded-lg relative flex items-center justify-center"
        style={{ maxWidth: dimension }}
      >
        <AnimatePresence>
          {isComplete && !isRevealed &&(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
              <p className="text-3xl font-bold text-white mb-2 font-headline drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Parabéns!
              </p>
              <p className="text-lg text-primary-foreground/80 mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Você montou o quebra-cabeça!
              </p>
              {showControls ? (
                <Button onClick={handleReset} className="pointer-events-auto">
                  Jogar Novamente
                </Button>
              ) : (
                <Button onClick={handleRevealClick} className="pointer-events-auto relative z-10" size="lg">
                    Revelar Surpresa
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="grid gap-1 bg-card/10 p-1 rounded-lg shadow-2xl"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: `${dimension}px`,
            height: `${dimension}px`,
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {pieces.map((piece, index) => (
            <motion.div
              key={piece.id}
              layout
              draggable={!isComplete}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "relative rounded-md overflow-hidden transition-all duration-300",
                !isComplete && "cursor-grab active:cursor-grabbing"
              )}
              style={{ width: pieceSize, height: pieceSize }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div
                className="w-full h-full bg-no-repeat bg-cover"
                style={piece.style}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {showControls && (
        <div className="flex items-center gap-4 mt-4">
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="mr-2" />
            Enviar sua Foto
          </Button>
          <Input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button onClick={handleReset} variant="ghost">
            <Shuffle className="mr-2" />
            Embaralhar
          </Button>
        </div>
      )}
    </div>
  );
};

export default Puzzle;
