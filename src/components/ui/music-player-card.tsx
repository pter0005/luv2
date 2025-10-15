'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state.played);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    playerRef.current?.seekTo(newProgress);
  };
  
  useEffect(() => {
    if (progressBarRef.current) {
        const currentProgress = progress * 100;
        progressBarRef.current.style.setProperty('--progress', `${currentProgress}%`);
    }
  }, [progress]);

  return (
    <div className="w-full max-w-xs mx-auto bg-card/80 rounded-2xl shadow-lg p-4 flex flex-col items-center border border-border/60">
       <style>{`
        .progress-bar {
            --progress: 0%;
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 6px;
            background: hsl(var(--muted));
            border-radius: 3px;
            outline: none;
            cursor: pointer;
            background-image: linear-gradient(hsl(var(--primary)), hsl(var(--primary)));
            background-size: var(--progress) 100%;
            background-repeat: no-repeat;
        }

        .progress-bar::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            margin-top: -4px;
        }

        .progress-bar::-moz-range-thumb {
            width: 14px;
            height: 14px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
        }
       `}</style>
        
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
          volume={0.8}
        />
      </div>

      <p className="text-sm font-semibold text-foreground mb-3">Sua Música</p>
      
      <div className="w-full flex items-center gap-x-2">
        <span className="text-xs font-mono text-muted-foreground w-10 text-left">{formatTime(progress * duration)}</span>
        <input
          ref={progressBarRef}
          type="range"
          min="0"
          max="0.999999"
          step="any"
          value={progress}
          onChange={handleSeek}
          className="progress-bar flex-grow"
        />
        <span className="text-xs font-mono text-muted-foreground w-10 text-right">{formatTime(duration)}</span>
      </div>

      <div className="mt-2">
        <motion.button
          onClick={handlePlayPause}
          className="bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
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
              {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

export default MusicPlayerCard;
