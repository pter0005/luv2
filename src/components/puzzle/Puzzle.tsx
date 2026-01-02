
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
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDimension(initialDimension);
  }, [initialDimension]);

  const pieceSize = dimension / GRID_SIZE;

  const shufflePieces = useCallback((array: Piece[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    // Ensure it's not already solved
    const isSolved = array.every((p, i) => p.originalIndex === i);
    if(isSolved) {
        return shufflePieces(array);
    }
    return array;
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
      setSelectedPieceIndex(null);
    },
    [pieceSize, shufflePieces, dimension]
  );

  useEffect(() => {
    const newSrc = initialImageSrc || `https://picsum.photos/seed/puzzle/${dimension}/${dimension}`;
    const img = new window.Image();
    img.src = newSrc;
    img.onload = () => {
        setImageSrc(newSrc);
        createAndShufflePieces(newSrc);
    }
  }, [initialImageSrc, dimension, createAndShufflePieces]);


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

  const handlePieceClick = (clickedIndex: number) => {
    if (isComplete || isRevealed) return;

    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(clickedIndex);
    } else {
      if(selectedPieceIndex !== clickedIndex) {
        const newPieces = [...pieces];
        [newPieces[selectedPieceIndex], newPieces[clickedIndex]] = [newPieces[clickedIndex], newPieces[selectedPieceIndex]];
        
        setPieces(newPieces);
        checkCompletion(newPieces);
      }
      setSelectedPieceIndex(null);
    }
  };

  const handleReset = () => {
    createAndShufflePieces(imageSrc);
  };
  
  const handleRevealClick = () => {
      setIsRevealed(true);
      if(onReveal) {
          setTimeout(onReveal, 300);
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
        >
          {pieces.map((piece, index) => (
            <motion.div
              key={piece.id}
              layout
              onClick={() => handlePieceClick(index)}
              className={cn(
                "relative rounded-md overflow-hidden transition-all duration-300 ring-2",
                !isComplete && "cursor-pointer",
                selectedPieceIndex === index ? "ring-primary shadow-2xl shadow-primary/50" : "ring-transparent"
              )}
              style={{ width: pieceSize, height: pieceSize }}
              animate={{ scale: selectedPieceIndex === index ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
