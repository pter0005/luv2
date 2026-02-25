'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
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
    if (!imageSrc || !imageSrc.startsWith('http')) return;

    setIsLoaded(false);
    setIsCompleted(false);
    setSelectedPieceId(null);
    setError(null);
    setPieces([]);

    // Usa um elemento img no DOM em vez de new window.Image()
    // Isso evita bloqueio de CORS do Firebase Storage
    const img = document.createElement('img');
    img.referrerPolicy = 'no-referrer';

    const processImage = () => {
        const containerW = containerRef.current?.offsetWidth ?? 0;
        if (containerW === 0) {
            setTimeout(processImage, 50);
            return;
        }

        const aspectRatio = img.naturalWidth > 0 ? img.naturalWidth / img.naturalHeight : 1;
        const boardWidth = Math.min(containerW, 350);
        const boardHeight = boardWidth / aspectRatio;
        const pW = boardWidth / GRID_SIZE;
        const pH = boardHeight / GRID_SIZE;

        setDimensions({ width: boardWidth, height: boardHeight, pieceW: pW, pieceH: pH });

        const targetPositions: { x: number; y: number }[] = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                targetPositions.push({ x: col * pW, y: row * pH });
            }
        }

        let shuffled = [...targetPositions].sort(() => Math.random() - 0.5);
        let ok = shuffled.some((pos, i) => pos.x !== targetPositions[i].x || pos.y !== targetPositions[i].y);
        while (!ok && shuffled.length > 1) {
            shuffled = [...targetPositions].sort(() => Math.random() - 0.5);
            ok = shuffled.some((pos, i) => pos.x !== targetPositions[i].x || pos.y !== targetPositions[i].y);
        }

        const initialPieces = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const id = row * GRID_SIZE + col;
                initialPieces.push({
                    id, r: row, c: col,
                    targetX: col * pW, targetY: row * pH,
                    currentX: shuffled[id].x, currentY: shuffled[id].y,
                });
            }
        }

        setPieces(initialPieces);
        setIsLoaded(true);
        checkWin(initialPieces);
    };

    img.onload = processImage;
    img.onerror = () => {
        setError("Não foi possível carregar a imagem. Verifique o link ou tente novamente.");
    };

    img.src = imageSrc;
    if (img.complete && img.naturalWidth > 0) processImage();

    return () => {
        img.onload = null;
        img.onerror = null;
    };
  }, [imageSrc, checkWin]);

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
        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive-foreground bg-destructive/80 p-4 text-center rounded-lg">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p className="text-sm font-bold">Erro de Imagem</p>
                <p className="text-xs">{error}</p>
            </div>
        )}

        {!isLoaded && !error && (
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
              top: 0,
              left: 0,
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
