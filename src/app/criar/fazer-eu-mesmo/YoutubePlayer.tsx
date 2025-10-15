"use client";

import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player/youtube";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface YoutubePlayerProps {
  url: string;
}

const YoutubePlayer = ({ url }: YoutubePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative flex items-center justify-center w-full my-6">
      {/* O ReactPlayer fica escondido, apenas para tocar o áudio */}
      <div className="absolute opacity-0 pointer-events-none w-0 h-0">
        <ReactPlayer
          url={url}
          playing={isPlaying}
          width="1px"
          height="1px"
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      {/* Botão de Play/Pause customizado */}
      <div className="relative">
        <button
          onClick={togglePlay}
          className={cn(
            "relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 music-play-button bg-primary/80 hover:bg-primary"
          )}
          aria-label={isPlaying ? "Pausar música" : "Tocar música"}
        >
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.div
                key="pause"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <Pause size={40} />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <Play size={40} className="ml-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Partículas de brilho */}
        {isPlaying && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="particle" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YoutubePlayer;
