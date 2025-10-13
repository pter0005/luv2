"use client";
import { useState, useRef, useEffect, Fragment, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

const GRID_SIZE = 3;
const PUZZLE_SIZE = 480;

type Piece = {
  id: number;
  originalIndex: number;
  style: React.CSSProperties;
};

type BoardPiece = Piece | null;

const Puzzle = () => {
  const [imageSrc, setImageSrc] = useState(
    "https://picsum.photos/seed/puzzle/480/480"
  );
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [board, setBoard] = useState<(BoardPiece)[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragPiece = useRef<Piece | null>(null);

  const pieceSize = PUZZLE_SIZE / GRID_SIZE;

  const createPuzzlePieces = useCallback((src: string) => {
    const newPieces: Piece[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      newPieces.push({
        id: i,
        originalIndex: i,
        style: {
          backgroundImage: `url(${src})`,
          backgroundSize: `${PUZZLE_SIZE}px ${PUZZLE_SIZE}px`,
          backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
          width: `${pieceSize}px`,
          height: `${pieceSize}px`,
          border: '1px solid hsl(var(--primary) / 0.2)',
        },
      });
    }
    // Shuffle pieces
    const shuffled = newPieces.sort(() => Math.random() - 0.5);
    setPieces(shuffled);
    setBoard(Array(GRID_SIZE * GRID_SIZE).fill(null));
    setIsComplete(false);
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

  const handleDragStart = (piece: Piece) => {
    dragPiece.current = piece;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragPiece.current) {
      const newBoard = [...board];
      
      // If the spot is already taken, move the piece back to the bank
      const pieceInSpot = newBoard[index];
      if (pieceInSpot) {
          setPieces((prev) => [...prev, pieceInSpot]);
      }

      newBoard[index] = dragPiece.current;
      setBoard(newBoard);
      setPieces((prev) => prev.filter((p) => p.id !== dragPiece.current!.id));
      dragPiece.current = null;
      checkCompletion(newBoard);
    }
  };

  const handleBankDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragPiece.current) {
      const pieceToReturn = dragPiece.current;
      // If piece was on board, remove it
      const newBoard = board.map(p => p?.id === pieceToReturn.id ? null : p);
      if (JSON.stringify(newBoard) !== JSON.stringify(board)) {
        setBoard(newBoard);
      }
      setPieces(prev => {
        if (prev.find(p => p.id === pieceToReturn.id)) return prev;
        return [...prev, pieceToReturn]
      });
      dragPiece.current = null;
    }
  }

  const checkCompletion = (currentBoard: (BoardPiece)[]) => {
    if (currentBoard.some(p => p === null)) {
      setIsComplete(false);
      return;
    }
    const isSolved = currentBoard.every((p, i) => p!.originalIndex === i);
    if (isSolved) {
      setIsComplete(true);
    }
  };

  const handleReset = () => {
    createPuzzlePieces(imageSrc);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full max-w-lg p-4 bg-background/50 rounded-lg shadow-lg relative">
        {isComplete && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg">
                <p className="text-3xl font-bold text-white mb-4 font-headline">Parabéns!</p>
                <p className="text-lg text-primary mb-6">Você montou o quebra-cabeça!</p>
                <Button onClick={handleReset}>Jogar Novamente</Button>
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
          {board.map((piece, index) => (
            <div
              key={index}
              className="puzzle-slot bg-black/30"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              onDragStart={() => piece && handleDragStart(piece)}
              draggable={!!piece}
              style={{ width: `${pieceSize}px`, height: `${pieceSize}px`, position: 'relative' }}
            >
              {piece ? (
                <div style={piece.style} className="cursor-grab active:cursor-grabbing"></div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div 
        className="piece-bank card-glow p-4 mt-4 w-full max-w-lg min-h-[160px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleBankDrop}
      >
        <p className="text-sm text-muted-foreground text-center mb-4">Arraste as peças daqui para o tabuleiro acima.</p>
        <div className="flex flex-wrap gap-2 justify-center">
            {pieces.map((piece) => (
            <div
                key={piece.id}
                style={piece.style}
                draggable
                onDragStart={() => handleDragStart(piece)}
                className="cursor-grab active:cursor-grabbing"
            />
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
        <Button onClick={handleReset} variant="ghost">Reiniciar</Button>
      </div>
    </div>
  );
};

export default Puzzle;
