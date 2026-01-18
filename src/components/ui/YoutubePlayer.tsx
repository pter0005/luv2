"use client";

import { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player/youtube";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Heart, Shuffle, SkipBack, SkipForward, Repeat } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface YoutubePlayerProps {
  url: string;
  songName?: string;
  artistName?: string;
  coverImage?: string;
  autoplay?: boolean;
  volume?: number;
}

const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : false;
    return videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null;
};

export default function YoutubePlayer({ 
  url, 
  songName, 
  artistName, 
  coverImage,
  autoplay = false, 
  volume = 0.45
}: YoutubePlayerProps) {
  const [hasWindow, setHasWindow] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);

  const thumbnailUrl = getYoutubeThumbnail(url);
  const finalCoverImage = coverImage || thumbnailUrl || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1000";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }
  }, []);

  useEffect(() => {
    if (autoplay && isReady) {
      setIsMuted(true);
      setIsPlaying(true);
    }
  }, [autoplay, isReady]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (isMuted) {
      setTimeout(() => {
        setIsMuted(false);
      }, 150);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };
  
  const handleManualPlayPause = () => {
    setIsMuted(false);
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const date = new Date(seconds * 1000);
    const minutes = date.getUTCMinutes();
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };
  
  const currentTimeInSeconds = duration * progress;
  const remainingTimeInSeconds = duration - currentTimeInSeconds;

  const currentTime = formatTime(currentTimeInSeconds);
  const remainingTime = formatTime(remainingTimeInSeconds);

  return (
    <div className="w-full max-w-sm mx-auto bg-zinc-900/95 p-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-4 backdrop-blur-xl">
       {hasWindow && <div style={{ display: 'none' }}>
            <ReactPlayer
            ref={playerRef}
            url={url}
            playing={isPlaying}
            volume={isMuted ? 0 : volume}
            muted={isMuted}
            onReady={() => setIsReady(true)}
            onPlay={handlePlay}
            onPause={handlePause}
            onDuration={setDuration}
            onProgress={(state) => setProgress(state.played)}
            width="0%"
            height="0%"
            config={{
                youtube: {
                playerVars: { 
                    controls: 0,
                    modestbranding: 1,
                }
                }
            }}
            />
        </div>}

        <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner">
            <Image src={finalCoverImage} alt={songName || "Capa da música"} fill className="object-cover" unoptimized/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="flex justify-between items-center px-1">
            <div className="flex flex-col max-w-[80%]">
              <h3 className="text-white text-xl font-bold truncate">{songName || "Carregando..."}</h3>
              <p className="text-zinc-400 font-medium truncate">{artistName || "Aguarde..."}</p>
            </div>
            <motion.div 
            animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
            >
            <Heart className={cn("w-7 h-7", isPlaying ? "fill-pink-500 text-pink-500" : "text-zinc-500")} />
            </motion.div>
        </div>

        <div className="px-1 space-y-1">
            <Slider 
                value={[progress * 100]} 
                max={100} 
                step={0.1}
                className="h-1.5 cursor-pointer"
                onValueChange={(value) => {
                    const newProgress = value[0] / 100;
                    setProgress(newProgress);
                    playerRef.current?.seekTo(newProgress, 'fraction');
                }}
            />
            <div className="flex justify-between text-xs text-zinc-500 font-mono">
            <span>{currentTime}</span>
            <span>-{remainingTime}</span>
            </div>
        </div>

        <div className="flex items-center justify-around px-2">
            <Shuffle className="w-5 h-5 text-zinc-500 cursor-pointer hover:text-white" />
            <SkipBack className="w-7 h-7 text-zinc-400 cursor-pointer hover:text-white" />
            <Button onClick={handleManualPlayPause} className="bg-white rounded-full w-16 h-16 flex items-center justify-center hover:scale-105 transition active:scale-95 shadow-xl">
            {isPlaying ? <Pause className="text-black w-8 h-8 fill-black" /> : <Play className="text-black w-8 h-8 fill-black ml-1" />}
            </Button>
            <SkipForward className="w-7 h-7 text-zinc-400 cursor-pointer hover:text-white" />
            <Repeat className="w-5 h-5 text-zinc-500 cursor-pointer hover:text-white" />
        </div>
    </div>
  );
};
