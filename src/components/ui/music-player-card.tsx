'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Loader2 } from 'lucide-react';
import ReactPlayer from 'react-player/youtube';

const formatTime = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface MusicPlayerCardProps {
  url: string;
}

const MusicPlayerCard: React.FC<MusicPlayerCardProps> = ({ url }) => {
  const [isClient, setIsClient] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const playerRef = useRef<ReactPlayer>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (isPlaying) {
      setPlayedSeconds(state.playedSeconds);
      if (progressBarRef.current) {
        const progressPercent = state.played * 100;
        progressBarRef.current.style.setProperty('--progress', `${progressPercent}%`);
      }
    }
  };
  
  const handleDuration = (duration: number) => {
    setDuration(duration);
    setIsLoading(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setPlayedSeconds(newTime);
    playerRef.current?.seekTo(newTime);
  };
  
  const handleReady = () => {
    setIsLoading(false);
  };
  
  if (!isClient) {
    return (
        <div className="w-full max-w-xs mx-auto bg-card/80 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border border-border/60 min-h-[190px]">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto bg-card/80 rounded-2xl shadow-lg p-6 flex flex-col items-center border border-border/60">
      <style>{`
        .progress-bar {
            --progress: ${duration > 0 ? (playedSeconds / duration) * 100 : 0}%;
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
        .progress-bar::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: white; border-radius: 50%; cursor: pointer; margin-top: -4px; }
        .progress-bar::-moz-range-thumb { width: 14px; height: 14px; background: white; border-radius: 50%; cursor: pointer; }
      `}</style>
      
      <div style={{ display: 'none' }}>
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={isPlaying}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onReady={handleReady}
          onEnded={() => setIsPlaying(false)}
          width="0"
          height="0"
        />
      </div>

      <p className="text-sm text-muted-foreground mb-4 h-5">
        {isLoading ? 'Carregando música...' : 'Música Pronta'}
      </p>

      <div className="w-full flex items-center gap-x-3 mb-4">
        <span className="text-xs font-mono text-muted-foreground w-12 text-left">{formatTime(playedSeconds)}</span>
        <input
          ref={progressBarRef}
          type="range"
          min="0"
          max={duration || 0}
          step="any"
          value={playedSeconds}
          onChange={handleSeek}
          className="progress-bar flex-grow"
          disabled={isLoading}
        />
        <span className="text-xs font-mono text-muted-foreground w-12 text-right">{formatTime(duration)}</span>
      </div>

      <motion.button
        onClick={handlePlayPause}
        disabled={isLoading}
        className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: isLoading ? 1 : 1.05 }}
        whileTap={{ scale: isLoading ? 1 : 0.95 }}
      >
        <AnimatePresence mode="wait">
            <motion.div
              key={isPlaying ? 'pause' : 'play'}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={32} /> : (isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />)}
            </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default MusicPlayerCard;
