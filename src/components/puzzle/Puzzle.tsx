"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Shuffle } from "lucide-react";

const GRID_SIZE = 3;
const PUZZLE_SIZE = 480;

type Piece = {
  id: number;
  originalIndex: number;
  currentIndex: number;
  style: React.CSSProperties;
};

const Puzzle = () => {
  const [imageSrc, setImageSrc] = useState(
    "https://picsum.photos/seed/puzzle/480/480"
  );
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pieceSize = PUZZLE_SIZE / GRID_SIZE;

  const shufflePieces = (arr: Piece[]): Piece[] => {
    let shuffledArray = [...arr];
    // Fisher-Yates shuffle
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    // Update currentIndex
    return shuffledArray.map((piece, index) => ({ ...piece, currentIndex: index }));
  };

  const createPuzzlePieces = useCallback((src: string) => {
    const newPieces: Piece[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      newPieces.push({
        id: i,
        originalIndex: i,
        currentIndex: i,
        style: {
          backgroundImage: `url(${src})`,
          backgroundSize: `${PUZZLE_SIZE}px ${PUZZLE_SIZE}px`,
          backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
          width: `${pieceSize}px`,
          height: `${pieceSize}px`,
        },
      });
    }

    setPieces(shufflePieces(newPieces));
    setIsComplete(false);
    setSelectedPieceIndex(null);
  }, [pieceSize]);

  useEffect(() => {
    createPuzzlePieces(imageSrc);
  }, [imageSrc, createPuzzlePieces]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const checkCompletion = useCallback((currentPieces: Piece[]) => {
    const isSolved = currentPieces.every(
      (p) => p.originalIndex === p.currentIndex
    );
    if (isSolved) {
      setIsComplete(true);
    }
  }, []);

  const handlePieceClick = (clickedIndex: number) => {
    if (isComplete) return;

    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(clickedIndex);
    } else {
      const newPieces = [...pieces];
      const clickedPiece = newPieces.find(p => p.currentIndex === clickedIndex)!;
      const selectedPiece = newPieces.find(p => p.currentIndex === selectedPieceIndex)!;

      // Swap pieces
      const tempIndex = clickedPiece.currentIndex;
      clickedPiece.currentIndex = selectedPiece.currentIndex;
      selectedPiece.currentIndex = tempIndex;

      setPieces(newPieces);
      setSelectedPieceIndex(null);
      checkCompletion(newPieces);
    }
  };
  
  const handleReset = () => {
    createPuzzlePieces(imageSrc);
  };

  const boardPieces = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
      return pieces.find(p => p.currentIndex === i) || null;
  });


  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full max-w-lg p-4 bg-background/50 rounded-lg shadow-lg relative">
        {isComplete && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg pointer-events-none">
                 {Array.from({ length: 30 }).map((_, i) => {
                    const size = Math.random() * 8 + 4;
                    const style = {
                        width: `${size}px`,
                        height: `${size}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 1.5}s`,
                    };
                    return <div key={i} className="sparkle" style={style}></div>;
                })}
                <p className="text-3xl font-bold text-white mb-4 font-headline drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Parabéns!</p>
                <p className="text-lg text-primary mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Você montou o quebra-cabeça!</p>
                <Button onClick={handleReset} className="pointer-events-auto">Jogar Novamente</Button>
            </div>
        )}
        <div
          className="puzzle-board"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: `${PUZZLE_SIZE}px`,
            height: `${PUZZLE_SIZE}px`,
          }}
        >
          {boardPieces.map((piece, index) => (
            <div
              key={index}
              className={`puzzle-slot cursor-pointer transition-all duration-300 ${selectedPieceIndex === index ? 'ring-2 ring-primary scale-95 shadow-lg' : ''}`}
              style={{ width: `${pieceSize}px`, height: `${pieceSize}px` }}
              onClick={() => handlePieceClick(index)}
            >
              {piece && <div style={piece.style}></div>}
            </div>
          ))}
        </div>
      </div>
      
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
    </div>
  );
};

export default Puzzle;
