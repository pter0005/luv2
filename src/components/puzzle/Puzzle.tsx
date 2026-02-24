'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const GRID_SIZE = 3;

interface PuzzleProps {
  imageSrc: string;
  onReveal?: () => void;
}

export default function Puzzle({ imageSrc, onReveal }: PuzzleProps) {
  const { t } = useTranslation();
  const [pieces, setPieces] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300, pieceW: 100, pieceH: 100 });
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);

  const checkWin = useCallback((currentPieces: any[]) => {
    if (currentPieces.length === 0) return;
    const isSolved = currentPieces.every(p => p.currentX === p.targetX && p.currentY === p.targetY);
    if (isSolved) {
      setIsCompleted(true);
      if (onReveal) {
        setTimeout(onReveal, 300);
      }
    }
  }, [onReveal]);

  useEffect(() => {
    if (!imageSrc || !containerRef.current) return;
    
    setIsLoaded(false);
    setIsCompleted(false);
    setSelectedPieceId(null);

    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    let loaded = false;

    const handleLoad = () => {
        if (loaded) return;
        loaded = true;

        const containerW = containerRef.current?.offsetWidth || 300;
        
        if (containerW === 0 || img.naturalWidth === 0) {
          console.warn("Puzzle container or image has no width, retrying...");
          return;
        }

        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        const boardWidth = Math.min(containerW, 400);
        const boardHeight = boardWidth / aspectRatio;

        const pW = boardWidth / GRID_SIZE;
        const pH = boardHeight / GRID_SIZE;

        setDimensions({ width: boardWidth, height: boardHeight, pieceW: pW, pieceH: pH });

        const initialPieces = [];
        const targetPositions: { x: number; y: number }[] = [];

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
            targetPositions.push({ x: col * pW, y: row * pH });
            }
        }

        let shuffledPositions = [...targetPositions].sort(() => Math.random() - 0.5);
        
        let isShuffledCorrectly = shuffledPositions.some((pos, i) => pos.x !== targetPositions[i].x || pos.y !== targetPositions[i].y);
        while(!isShuffledCorrectly) {
            shuffledPositions = [...targetPositions].sort(() => Math.random() - 0.5);
            isShuffledCorrectly = shuffledPositions.some((pos, i) => pos.x !== targetPositions[i].x || pos.y !== targetPositions[i].y);
        }

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
            const id = row * GRID_SIZE + col;
            initialPieces.push({
                id,
                r: row,
                c: col,
                targetX: col * pW,
                targetY: row * pH,
                currentX: shuffledPositions[id].x,
                currentY: shuffledPositions[id].y,
            });
            }
        }
        setPieces(initialPieces);
        setIsLoaded(true);
    };

    img.onload = handleLoad;
    img.onerror = () => {
        console.error("Puzzle image failed to load:", imageSrc);
        setIsLoaded(false); 
    };

    img.src = imageSrc;

    if (img.complete) {
        handleLoad();
    }

  }, [imageSrc]);

  const handlePieceClick = (clickedPieceId: number) => {
    if (isCompleted) return;

    if (selectedPieceId === null) {
      setSelectedPieceId(clickedPieceId);
    } else {
      const newPieces = [...pieces];
      const clickedIndex = newPieces.findIndex(p => p.id === clickedPieceId);
      const selectedIndex = newPieces.findIndex(p => p.id === selectedPieceId);

      if (clickedIndex !== -1 && selectedIndex !== -1 && clickedIndex !== selectedIndex) {
        const tempX = newPieces[clickedIndex].currentX;
        const tempY = newPieces[clickedIndex].currentY;
        newPieces[clickedIndex].currentX = newPieces[selectedIndex].currentX;
        newPieces[clickedIndex].currentY = newPieces[selectedIndex].currentY;
        newPieces[selectedIndex].currentX = tempX;
        newPieces[selectedIndex].currentY = tempY;
      }
      
      setSelectedPieceId(null);
      setPieces(newPieces);
      checkWin(newPieces);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div 
        ref={containerRef}
        className="relative puzzle-board"
        style={{ 
            width: '100%', 
            maxWidth: '350px',
            height: isLoaded ? dimensions.height + 4 : '300px'
        }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-primary">
            <Loader2 className="w-10 h-10 animate-spin mb-2" />
            <span className="text-sm font-medium">{t('puzzle.loading')}</span>
          </div>
        )}

        {isLoaded && pieces.map((p) => (
          <motion.div
            key={p.id}
            onClick={() => handlePieceClick(p.id)}
            animate={{ 
                x: p.currentX,
                y: p.currentY,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute puzzle-slot cursor-pointer"
            style={{
              width: dimensions.pieceW,
              height: dimensions.pieceH,
              outline: selectedPieceId === p.id ? '3px solid hsl(var(--primary))' : 'none',
              outlineOffset: '-3px',
              zIndex: selectedPieceId === p.id ? 2 : 1
            }}
          >
            <div 
                className="w-full h-full pointer-events-none"
                style={{
                    backgroundImage: `url('${imageSrc}')`,
                    backgroundSize: `${dimensions.width}px ${dimensions.height}px`,
                    backgroundPosition: `-${p.c * dimensions.pieceW}px -${p.r * dimensions.pieceH}px`
                }}
            />
          </motion.div>
        ))}

        <AnimatePresence>
            {isCompleted && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <div className="text-center">
                        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-2" />
                        </motion.div>
                        <h3 className="text-white font-bold text-xl">{t('puzzle.perfect')}</h3>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
