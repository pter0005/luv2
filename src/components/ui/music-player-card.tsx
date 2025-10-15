'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Loader2 } from 'lucide-react';
import ReactPlayer from 'react-player/youtube';

interface MusicPlayerCardProps {
  url: string;
}

const MusicPlayerCard: React.FC<MusicPlayerCardProps> = ({ url }) => {
  // Garante que o ReactPlayer só renderize no cliente
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const togglePlayPause = () => {
    if (isReady) {
      setIsPlaying(!isPlaying);
    }
  };

  const particles = Array.from({ length: 15 });

  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      {/* Player do YouTube fica escondido, só para tocar o áudio */}
      <div className="hidden">
        {hasMounted && (
          <ReactPlayer
            url={url}
            playing={isPlaying}
            onReady={() => setIsReady(true)}
            onEnded={() => setIsPlaying(false)}
            width="0"
            height="0"
            config={{
              youtube: {
                playerVars: {
                  controls: 0,
                  disablekb: 1,
                  fs: 0,
                  modestbranding: 1,
                  playsinline: 1,
                },
              },
            }}
          />
        )}
      </div>

      {/* Botão de Play/Pause */}
      <motion.button
        onClick={togglePlayPause}
        disabled={!isReady}
        className="relative z-10 bg-primary/80 backdrop-blur-sm text-primary-foreground w-20 h-20 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-wait ring-4 ring-primary/30 music-play-button"
        whileHover={{ scale: !isReady ? 1 : 1.1 }}
        whileTap={{ scale: !isReady ? 1 : 0.95 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isReady ? (isPlaying ? 'pause' : 'play') : 'loader'}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            {!isReady ? (
              <Loader2 className="animate-spin" size={36} />
            ) : isPlaying ? (
              <Pause size={36} />
            ) : (
              <Play size={36} className="ml-1" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
      
      {/* Efeito de brilho roxo */}
      {isPlaying && isReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {particles.map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicPlayerCard;
