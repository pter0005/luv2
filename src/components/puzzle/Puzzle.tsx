"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";

const GRID_SIZE = 3; // 3x3 = 9 peças

interface PuzzleProps {
  imageSrc: string;
  onReveal?: () => void;
}

export default function Puzzle({ imageSrc, onReveal }: PuzzleProps) {
  const [pieces, setPieces] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 400, pieceW: 100, pieceH: 133 });

  // 1. Carregar imagem e calcular dimensões reais baseadas no container
  useEffect(() => {
    if (!imageSrc || !containerRef.current) return;
    
    setIsLoaded(false);
    setIsCompleted(false);

    const img = new Image();
    
    img.onload = () => {
      const containerW = containerRef.current?.offsetWidth || 300;
      // Mantém a proporção da imagem original, mas limita à largura do container
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      const boardWidth = containerW;
      const boardHeight = boardWidth / aspectRatio;

      const pW = boardWidth / GRID_SIZE;
      const pH = boardHeight / GRID_SIZE;

      setDimensions({ width: boardWidth, height: boardHeight, pieceW: pW, pieceH: pH });

      // Gerar peças
      const newPieces = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const id = row * GRID_SIZE + col;
          
          // Posição CORRETA (onde encaixa)
          const targetX = col * pW;
          const targetY = row * pH;

          // Posição ALEATÓRIA (espalhada)
          // Espalha num raio em volta do tabuleiro
          const scatterX = (Math.random() * boardWidth * 1.2) - (boardWidth * 0.1);
          const scatterY = (Math.random() * boardHeight * 1.2) - (boardHeight * 0.1);

          newPieces.push({
            id,
            r: row,
            c: col,
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

  // 2. Lógica de Arrastar e Encaixar
  const handleDragEnd = (pieceId: number, info: any) => {
    const pieceIndex = pieces.findIndex((p) => p.id === pieceId);
    if (pieceIndex === -1) return;

    const piece = pieces[pieceIndex];
    // Pega a posição final do arraste relativo ao elemento pai
    const draggedX = piece.currentX + info.offset.x;
    const draggedY = piece.currentY + info.offset.y;

    // Distância para o encaixe (Snap)
    const dist = Math.hypot(draggedX - piece.targetX, draggedY - piece.targetY);

    if (dist < 40) { // Se estiver a menos de 40px, puxa pro lugar
      const newPieces = [...pieces];
      newPieces[pieceIndex] = {
        ...piece,
        currentX: piece.targetX,
        currentY: piece.targetY,
        isSnapped: true,
      };
      setPieces(newPieces);
      checkWin(newPieces);
    }
  };

  const checkWin = (currentPieces: any[]) => {
    if (currentPieces.every((p) => p.isSnapped)) {
      setIsCompleted(true);
      if (onReveal) setTimeout(onReveal, 1500); // Espera animação de vitória
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      
      {/* Container Principal */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ 
            width: '100%', 
            maxWidth: '350px', // Limite para telas grandes
            height: isLoaded ? dimensions.height + 100 : '300px' // Espaço extra para peças soltas
        }}
      >
        
        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-500">
            <Loader2 className="w-10 h-10 animate-spin mb-2" />
            <span className="text-sm font-medium">Carregando memórias...</span>
          </div>
        )}

        {/* Área do Tabuleiro (Guia visual) */}
        {isLoaded && (
            <div 
                className="absolute left-0 top-0 border-2 border-dashed border-white/20 rounded-lg bg-black/20"
                style={{ width: dimensions.width, height: dimensions.height }}
            >
                {/* Mensagem de Vitória */}
                <AnimatePresence>
                    {isCompleted && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg"
                        >
                            <div className="text-center">
                                <motion.div 
                                    animate={{ rotate: [0, 10, -10, 0] }} 
                                    transition={{ duration: 0.5 }}
                                >
                                    <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-2" />
                                </motion.div>
                                <h3 className="text-white font-bold text-xl">Perfeito!</h3>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}

        {/* As Peças */}
        {isLoaded && pieces.map((p) => (
          <motion.div
            key={p.id}
            drag={!p.isSnapped && !isCompleted}
            dragMomentum={false}
            onDragEnd={(_, info) => handleDragEnd(p.id, info)}
            initial={{ x: p.currentX, y: p.currentY, scale: 0 }}
            animate={{ 
                x: p.isSnapped ? p.targetX : undefined, // Framer motion cuida do resto se não estiver snapped
                y: p.isSnapped ? p.targetY : undefined,
                scale: 1,
                zIndex: p.isSnapped ? 1 : 50, // Peça solta fica por cima
                filter: p.isSnapped ? 'brightness(1)' : 'brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
            }}
            whileDrag={{ scale: 1.1, zIndex: 100, cursor: 'grabbing' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute rounded-sm overflow-hidden"
            style={{
              width: dimensions.pieceW,
              height: dimensions.pieceH,
              cursor: p.isSnapped ? 'default' : 'grab',
            }}
          >
            {/* Imagem Recortada via Background */}
            <div 
                className="w-full h-full pointer-events-none"
                style={{
                    backgroundImage: `url('${imageSrc}')`,
                    backgroundSize: `${dimensions.width}px ${dimensions.height}px`,
                    backgroundPosition: `-${p.c * dimensions.pieceW}px -${p.r * dimensions.pieceH}px`
                }}
            />
            
            {/* Brilho ao encaixar */}
            {p.isSnapped && (
                <motion.div 
                    initial={{ opacity: 1 }} 
                    animate={{ opacity: 0 }} 
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 border-2 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.6)]"
                />
            )}
          </motion.div>
        ))}

      </div>
    </div>
  );
}