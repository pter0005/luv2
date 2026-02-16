
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GRID_SIZE = 3;
const SNAP_THRESHOLD = 30; // Pixels to snap

const Puzzle = ({ imageSrc, onReveal, maxDimension = 450 }: { imageSrc: string; onReveal?: () => void; maxDimension?: number; }) => {
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'completed'>('loading');
  const [pieces, setPieces] = useState<any[]>([]);
  const [puzzleDimensions, setPuzzleDimensions] = useState({ width: 0, height: 0, pieceWidth: 0, pieceHeight: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const shufflePieces = useCallback((array: any[]) => {
    // Shuffles pieces and places them randomly around the board
    const board = containerRef.current;
    if (!board) return array;

    return array.map(piece => {
        // Place pieces randomly to the left, right, or bottom, but not on the board itself.
        const side = Math.floor(Math.random() * 3); // 0: left, 1: right, 2: bottom
        let x, y;

        if (side === 0) { // Left
            x = Math.random() * -puzzleDimensions.pieceWidth * 1.5;
            y = Math.random() * (puzzleDimensions.height - puzzleDimensions.pieceHeight);
        } else if (side === 1) { // Right
            x = puzzleDimensions.width + Math.random() * puzzleDimensions.pieceWidth * 0.5;
            y = Math.random() * (puzzleDimensions.height - puzzleDimensions.pieceHeight);
        } else { // Bottom
            x = Math.random() * (puzzleDimensions.width - puzzleDimensions.pieceWidth);
            y = puzzleDimensions.height + Math.random() * puzzleDimensions.pieceHeight * 0.5;
        }

        return { ...piece, x, y };
    });
  }, [puzzleDimensions]);

  useEffect(() => {
    if (!imageSrc) return;
    
    setGameState('loading');
    setPieces([]);

    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for canvas with remote images

    const handleImageLoad = () => {
      const containerWidth = containerRef.current?.clientWidth || maxDimension;
      const aspect = img.width / img.height;
      const boardWidth = Math.min(containerWidth * 0.7, maxDimension * 0.7); // Board is smaller than container
      const boardHeight = boardWidth / aspect;

      const pieceWidth = boardWidth / GRID_SIZE;
      const pieceHeight = boardHeight / GRID_SIZE;

      setPuzzleDimensions({ width: boardWidth, height: boardHeight, pieceWidth, pieceHeight });

      const initialPieces = [];
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        initialPieces.push({ 
            id: i, 
            isSnapped: false,
            x: 0,
            y: 0,
            // Store correct position for snapping
            targetX: (i % GRID_SIZE) * pieceWidth,
            targetY: Math.floor(i / GRID_SIZE) * pieceHeight
        });
      }
      setPieces(shufflePieces(initialPieces));
      setGameState('playing');
    };

    img.onload = handleImageLoad;
    img.onerror = () => {
      console.error("Error loading puzzle image.");
      setGameState('loading');
    };
    img.src = imageSrc;
    
    // Handle cached images
    if (img.complete) {
        handleImageLoad();
    }

  }, [imageSrc, maxDimension, shufflePieces]);


  const handleDragEnd = (pieceId: number, info: any) => {
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece || piece.isSnapped) return;
    
    const { pieceWidth, pieceHeight } = puzzleDimensions;
    const dropZone = containerRef.current?.querySelector('#drop-zone')?.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!dropZone || !containerRect) return;

    // Current position of the piece relative to the container
    const currentX = info.point.x - containerRect.left - (pieceWidth / 2);
    const currentY = info.point.y - containerRect.top - (pieceHeight / 2);

    // Target position relative to the container
    const dropZoneStartX = dropZone.left - containerRect.left;
    const dropZoneStartY = dropZone.top - containerRect.top;
    const targetX = dropZoneStartX + piece.targetX;
    const targetY = dropZoneStartY + piece.targetY;
    
    // Check if it's close enough to snap
    if (Math.abs(currentX - targetX) < SNAP_THRESHOLD && Math.abs(currentY - targetY) < SNAP_THRESHOLD) {
      const newPieces = pieces.map(p => 
        p.id === pieceId ? { ...p, isSnapped: true, x: targetX, y: targetY } : p
      );
      setPieces(newPieces);

      // Check for win condition
      const allSnapped = newPieces.every(p => p.isSnapped);
      if (allSnapped) {
        setGameState('completed');
        if (onReveal) {
            setTimeout(() => onReveal(), 800);
        }
      }
    }
  };

  const allSnapped = pieces.every(p => p.isSnapped);
  useEffect(() => {
    if (pieces.length > 0 && allSnapped) {
        setGameState('completed');
        if (onReveal) {
            setTimeout(() => onReveal(), 800);
        }
    }
  }, [pieces, allSnapped, onReveal]);

  return (
    <div className="w-full flex justify-center items-center p-4" style={{ minHeight: maxDimension * 1.5 }}>
      <div 
        ref={containerRef}
        className="relative touch-none select-none bg-zinc-900/50 rounded-xl shadow-2xl"
        style={{ width: maxDimension, height: maxDimension * 1.25 }}
      >
        <AnimatePresence>
            {gameState === 'loading' && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-900/80 rounded-xl">
                    <Loader2 className="animate-spin text-white w-10 h-10" />
                </motion.div>
            )}
            {gameState === 'completed' && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-4 rounded-full shadow-lg">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {gameState !== 'loading' && (
          <>
            <div 
                id="drop-zone"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/20 shadow-inner"
                style={{ width: puzzleDimensions.width, height: puzzleDimensions.height }}
            ></div>

            {pieces.map((piece) => {
              const col = piece.id % GRID_SIZE;
              const row = Math.floor(piece.id / GRID_SIZE);

              return (
                <motion.div
                    key={piece.id}
                    className="absolute cursor-grab active:cursor-grabbing rounded-md shadow-lg"
                    style={{
                        width: puzzleDimensions.pieceWidth,
                        height: puzzleDimensions.pieceHeight,
                        backgroundImage: `url("${imageSrc}")`,
                        backgroundSize: `${puzzleDimensions.width}px ${puzzleDimensions.height}px`,
                        backgroundPosition: `-${col * puzzleDimensions.pieceWidth}px -${row * puzzleDimensions.pieceHeight}px`,
                        zIndex: piece.isSnapped ? 1 : 10,
                    }}
                    initial={{ x: piece.x, y: piece.y, scale: 1 }}
                    animate={piece.isSnapped ? {
                        x: piece.x,
                        y: piece.y,
                        scale: [1, 1.1, 1],
                        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
                        boxShadow: ['0 0 0px rgba(255,215,0,0)', '0 0 20px rgba(255,215,0,0.8)', '0 0 0px rgba(255,215,0,0)'],
                        zIndex: 1,
                    } : { x: piece.x, y: piece.y }}
                    drag={!piece.isSnapped}
                    dragConstraints={containerRef}
                    dragElastic={0.4}
                    onDragEnd={(_, info) => handleDragEnd(piece.id, info)}
                    transition={piece.isSnapped ? { duration: 0.4, ease: "easeOut" } : { type: "spring", stiffness: 300, damping: 20 }}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Puzzle;
