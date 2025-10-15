'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import Image from 'next/image';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Função auxiliar para formatar o tempo de segundos para MM:SS
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const date = new Date(seconds * 1000);
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

interface MusicPlayerCardProps {
  url: string;
}

const MusicPlayerCard: React.FC<MusicPlayerCardProps> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [metadata, setMetadata] = useState({
    title: 'Sua Música',
    author: 'Carregando...',
    thumbnail: '',
  });

  const playerRef = useRef<ReactPlayer>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    try {
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) {
        setMetadata((prev) => ({
          ...prev,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          author: 'YouTube',
        }));
      }
    } catch (e) {
      console.error('Invalid YouTube URL for thumbnail', e);
    }
  }, [url]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
  }) => {
    setPlayed(state.played);
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    playerRef.current?.seekTo(newPlayed);
  };

  const [currentTime, setCurrentTime] = useState(0);

  // Efeito para atualizar o valor da barra de progresso visualmente
  useEffect(() => {
    if (progressBarRef.current) {
        const progress = played * 100;
        progressBarRef.current.style.setProperty('--progress', `${progress}%`);
    }
  }, [played]);
  

  if (!isClient) {
    return (
      <div className="w-full max-w-sm mx-auto bg-card/80 rounded-2xl shadow-lg p-6 flex flex-col items-center animate-pulse">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-muted shadow-2xl mb-6"></div>
        <div className="text-center mb-6 w-full">
            <div className="h-7 w-3/4 bg-muted rounded-md mx-auto mb-2"></div>
            <div className="h-5 w-1/2 bg-muted rounded-md mx-auto"></div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full mb-4"></div>
        <div className="flex items-center justify-center space-x-6 w-full">
            <div className="h-7 w-7 bg-muted rounded-full"></div>
            <div className="h-7 w-7 bg-muted rounded-full"></div>
            <div className="h-16 w-16 bg-muted rounded-full"></div>
            <div className="h-7 w-7 bg-muted rounded-full"></div>
            <div className="h-7 w-7 bg-muted rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-card/90 text-foreground rounded-2xl shadow-lg p-6 flex flex-col items-center font-sans border border-border/60">
       <style>{`
        .progress-bar {
            --progress: 0%;
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 8px;
            background: hsl(var(--muted));
            border-radius: 4px;
            outline: none;
            cursor: pointer;
            background-image: linear-gradient(hsl(var(--primary)), hsl(var(--primary)));
            background-size: var(--progress) 100%;
            background-repeat: no-repeat;
        }

        .progress-bar::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: white;
            border: 2px solid hsl(var(--primary));
            border-radius: 50%;
            cursor: pointer;
            margin-top: -4px;
        }

        .progress-bar::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: white;
            border: 2px solid hsl(var(--primary));
            border-radius: 50%;
            cursor: pointer;
        }
       `}</style>
        
      {/* ReactPlayer escondido */}
      <div className="absolute -z-10 opacity-0">
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={isPlaying}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={() => setIsPlaying(false)}
          width="1px"
          height="1px"
        />
      </div>

      {/* Album Art */}
      <motion.div
        className="relative mb-6"
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        <Image
          src={metadata.thumbnail || 'https://placehold.co/224x224/1a1a1a/ffffff?text=Music'}
          alt={`${metadata.title} album art`}
          width={224}
          height={224}
          className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover shadow-2xl border-4 border-background"
        />
      </motion.div>

      {/* Informações da Música */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight truncate max-w-[250px]">{metadata.title}</h2>
        <p className="text-sm text-muted-foreground">{metadata.author}</p>
      </div>

      {/* Barra de Progresso e Tempos */}
      <div className="w-full flex items-center gap-x-3 mb-4">
        <span className="text-xs font-mono text-muted-foreground w-12 text-left">{formatTime(currentTime)}</span>
        <input
          ref={progressBarRef}
          type="range"
          min="0"
          max="0.999999" // Máximo para ReactPlayer
          step="any"
          value={played}
          onChange={handleSeekChange}
          className="progress-bar flex-grow"
        />
        <span className="text-xs font-mono text-muted-foreground w-12 text-right">{formatTime(duration)}</span>
      </div>


      {/* Controles */}
      <div className="flex items-center justify-center space-x-6 w-full">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className='text-muted-foreground' disabled>
          <Shuffle size={20} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-foreground" disabled>
          <SkipBack size={28} />
        </motion.button>
        
        <motion.button
          onClick={handlePlayPause}
          className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isPlaying ? 'pause' : 'play'}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-foreground" disabled>
          <SkipForward size={28} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className='text-muted-foreground' disabled>
          <Repeat size={20} />
        </motion.button>
      </div>
    </div>
  );
};

export default MusicPlayerCard;
