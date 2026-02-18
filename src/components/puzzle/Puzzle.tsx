'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const GRID_SIZE = 3;

// Each path defines a piece shape within a 120x120 viewbox (100x100 piece + 10 margin for tabs)
// T=Top, R=Right, B=Bottom, L=Left. 0=flat, 1=tab, -1=indent.
const pieceShapes = [
  [0, 1, 1, 0], [0, 1, 1, -1], [0, 0, 1, -1],
  [-1, 1, 1, 0], [-1, 1, 1, -1], [-1, 0, 1, -1],
  [-1, 1, 0, 0], [-1, 1, 0, -1], [-1, 0, 0, -1],
];

const generatePath = (shape: number[]) => {
  const [T, R, B, L] = shape;
  let d = 'M 10 10 '; // Start with margin
  
  const tab = (dir: 'h' | 'v') => dir === 'h' ? 'c 5 -15 25 -15 30 0 ' : 'c 15 5 15 25 0 30 ';
  const indent = (dir: 'h' | 'v') => dir === 'h' ? 'c 5 15 25 15 30 0 ' : 'c -15 5 -15 25 0 30 ';

  // Top edge
  d += 'h 30 ';
  if (T === 1) d += tab('h'); else if (T === -1) d += indent('h'); else d += 'h 40 ';
  d += 'h 30 ';
  
  // Right edge
  d += 'v 30 ';
  if (R === 1) d += tab('v'); else if (R === -1) d += indent('v'); else d += 'v 40 ';
  d += 'v 30 ';
  
  // Bottom edge
  d += 'h -30 ';
  if (B === 1) d += 'c -5 15 -25 15 -30 0 '; else if (B === -1) d += 'c -5 -15 -25 -15 -30 0 '; else d += 'h -40 ';
  d += 'h -30 ';

  // Left edge
  d += 'v -30 ';
  if (L === 1) d += 'c -15 -5 -15 -25 0 -30 '; else if (L === -1) d += 'c 15 -5 15 -25 0 -30 '; else d += 'v -40 ';
  d += 'v -30 ';

  d += 'z';
  return d;
}

const pieceMasks = pieceShapes.map(shape => 
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="${generatePath(shape)}" fill="black" /></svg>`
  )}`
);

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
      
      const boardWidth = containerW;
      const boardHeight = boardWidth / aspectRatio;

      const pW = boardWidth / GRID_SIZE;
      const pH = boardHeight / GRID_SIZE;

      setDimensions({ width: boardWidth, height: boardHeight, pieceW: pW, pieceH: pH });

      const newPieces = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const id = row * GRID_SIZE + col;
          const targetX = col * pW;
          const targetY = row * pH;

          const scatterRadius = boardWidth * 0.7;
          const angle = Math.random() * 2 * Math.PI;
          const randomDist = Math.random() * scatterRadius;
          const scatterX = (boardWidth / 2) + Math.cos(angle) * randomDist - pW/2;
          const scatterY = (boardHeight / 2) + Math.sin(angle) * randomDist - pH/2;

          newPieces.push({
            id,
            targetX,
            targetY,
            currentX: scatterX,
            currentY: scatterY,
            isSnapped: false,
          });
        }
      }
      setPieces(newPieces);
      setIsLoaded(true);
    };

    img.src = imageSrc;
  }, [imageSrc]);

  const handleDragEnd = (pieceId: number, info: any) => {
    const pieceIndex = pieces.findIndex((p) => p.id === pieceId);
    if (pieceIndex === -1) return;

    const piece = pieces[pieceIndex];
    const draggedX = piece.currentX + info.offset.x;
    const draggedY = piece.currentY + info.offset.y;

    const dist = Math.hypot(draggedX - piece.targetX, draggedY - piece.targetY);

    const snapThreshold = dimensions.pieceW * 0.4;
    if (dist < snapThreshold) {
      const newPieces = [...pieces];
      newPieces[pieceIndex] = {
        ...piece,
        currentX: piece.targetX,
        currentY: piece.targetY,
        isSnapped: true,
      };
      setPieces(newPieces);
      checkWin(newPieces);
    } else {
        // If not snapped, update current position to where it was dropped
        const newPieces = [...pieces];
        newPieces[pieceIndex] = { ...piece, currentX: draggedX, currentY: draggedY };
        setPieces(newPieces);
    }
  };

  const checkWin = useCallback((currentPieces: any[]) => {
    if (currentPieces.every((p) => p.isSnapped)) {
      setIsCompleted(true);
      if (onReveal) setTimeout(onReveal, 1500); 
    }
  }, [onReveal]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="relative"
        style={{ 
            width: '100%', 
            maxWidth: '400px',
            height: isLoaded ? dimensions.height + 200 : '400px'
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
                className="absolute left-0 top-0 rounded-lg bg-black/20"
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
            onDragEnd={(_, info) => handleDragEnd(p.id, info)}
            initial={{ x: p.currentX, y: p.currentY, scale: 0.5, opacity: 0 }}
            animate={{ 
                x: p.isSnapped ? p.targetX : p.currentX,
                y: p.isSnapped ? p.targetY : p.currentY,
                scale: 1,
                opacity: 1,
                zIndex: p.isSnapped ? 1 : 50,
            }}
            whileDrag={{ scale: 1.1, zIndex: 100, cursor: 'grabbing' }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: Math.random() * 0.5 }}
            className="absolute"
            style={{
              width: dimensions.pieceW,
              height: dimensions.pieceH,
              cursor: p.isSnapped ? 'default' : 'grab',
              maskImage: `url("${pieceMasks[p.id]}")`,
              WebkitMaskImage: `url("${pieceMasks[p.id]}")`,
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
            }}
          >
            <div 
                className="w-full h-full pointer-events-none"
                style={{
                    backgroundImage: `url('${imageSrc}')`,
                    backgroundSize: `${dimensions.width}px ${dimensions.height}px`,
                    backgroundPosition: `-${(p.id % GRID_SIZE) * dimensions.pieceW}px -${Math.floor(p.id / GRID_SIZE) * dimensions.pieceH}px`,
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
