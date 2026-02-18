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

  useEffect(() => {
    if (!imageSrc || !containerRef.current) return;
    
    setIsLoaded(false);
    setIsCompleted(false);

    const img = new Image();
    
    img.onload = () => {
      const containerW = containerRef.current?.offsetWidth || 300;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      const boardWidth = Math.min(containerW, 400);
      const boardHeight = boardWidth / aspectRatio;

      const pW = boardWidth / GRID_SIZE;
      const pH = boardHeight / GRID_SIZE;

      setDimensions({ width: boardWidth, height: boardHeight, pieceW: pW, pieceH: pH });

      const newPieces = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const id = row * GRID_SIZE + col;
          
          const scatterRadius = boardWidth * 0.5;
          const angle = Math.random() * 2 * Math.PI;
          const randomDist = Math.random() * scatterRadius;
          const scatterX = (boardWidth / 2) + Math.cos(angle) * randomDist - pW/2;
          const scatterY = (boardHeight / 2) + Math.sin(angle) * randomDist - (pH/2) - (boardHeight/2) - 100;

          newPieces.push({
            id,
            r: row,
            c: col,
            targetX: col * pW,
            targetY: row * pH,
            currentX: scatterX,
            currentY: scatterY,
            isSnapped: false,
          });
        }
      }
      setPieces(newPieces.sort(() => Math.random() - 0.5));
      setIsLoaded(true);
    };

    img.src = imageSrc;
  }, [imageSrc]);

  const checkWin = useCallback((currentPieces: any[]) => {
    if (currentPieces.every((p) => p.isSnapped)) {
      setIsCompleted(true);
      if (onReveal) setTimeout(onReveal, 1500); 
    }
  }, [onReveal]);

  const handlePieceDrop = (pieceId: number, finalX: number, finalY: number) => {
    const pieceIndex = pieces.findIndex((p) => p.id === pieceId);
    if (pieceIndex === -1 || pieces[pieceIndex].isSnapped) return;

    const piece = pieces[pieceIndex];
    const dist = Math.hypot(finalX - piece.targetX, finalY - piece.targetY);
    const snapThreshold = dimensions.pieceW * 0.4;
    
    const newPieces = [...pieces];
    if (dist < snapThreshold) {
      newPieces[pieceIndex] = { ...piece, currentX: piece.targetX, currentY: piece.targetY, isSnapped: true };
    } else {
      newPieces[pieceIndex] = { ...piece, currentX: finalX, currentY: finalY };
    }
    setPieces(newPieces);
    checkWin(newPieces);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="relative"
        style={{ 
            width: '100%', 
            maxWidth: '350px',
            height: isLoaded ? dimensions.height + 100 : '300px'
        }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-primary">
            <Loader2 className="w-10 h-10 animate-spin mb-2" />
            <span className="text-sm font-medium">{t('puzzle.loading')}</span>
          </div>
        )}

        {isLoaded && (
            <div 
                className="absolute left-0 top-[50px] border-2 border-dashed border-white/20 rounded-lg bg-black/20"
                style={{ width: dimensions.width, height: dimensions.height }}
            >
                <AnimatePresence>
                    {isCompleted && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg"
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
        )}

        {isLoaded && pieces.map((p) => (
          <motion.div
            key={p.id}
            drag={!p.isSnapped && !isCompleted}
            dragMomentum={false}
            onDragEnd={(event, info) => handlePieceDrop(p.id, p.currentX + info.offset.x, p.currentY + info.offset.y)}
            initial={{ x: p.currentX, y: p.currentY, scale: 0.5, opacity: 0 }}
            animate={{ 
                x: p.currentX,
                y: p.currentY,
                scale: 1,
                opacity: 1,
                zIndex: p.isSnapped ? 1 : 50,
            }}
            whileDrag={{ scale: 1.1, zIndex: 100, cursor: 'grabbing' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute rounded-md overflow-hidden shadow-lg"
            style={{
              width: dimensions.pieceW,
              height: dimensions.pieceH,
              cursor: p.isSnapped ? 'default' : 'grab',
              top: p.isSnapped ? dimensions.height + 50 : 0, // Move to board area when snapped
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
            {p.isSnapped && (
                <motion.div 
                    initial={{ opacity: 1 }} 
                    animate={{ opacity: 0 }} 
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 ring-2 ring-yellow-400"
                />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
