"use client";

import React, { useState, useEffect, useRef, useImperativeHandle } from "react";
import ReactPlayer from "react-player/youtube";
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
  volume?: number;
}

const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : false;
    return videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null;
};

const YoutubePlayer = React.forwardRef<any, YoutubePlayerProps>(({ 
  url, 
  songName, 
  artistName, 
  coverImage,
  volume = 0.5
}, ref) => {
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

  useImperativeHandle(ref, () => ({
    play: () => {
      if (isReady) {
        setIsPlaying(true);
        setIsMuted(false);
      }
    }
  }));

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };
  
  const handleManualPlayPause = () => {
    setIsMuted(false);
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const newProgress = value[0] / 100;
    setProgress(newProgress);
    playerRef.current?.seekTo(newProgress, 'fraction');
    if (!isPlaying) {
        setIsMuted(false);
        setIsPlaying(true);
    }
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

  return (
    <div className="w-full max-w-sm mx-auto bg-zinc-900/95 p-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-4 backdrop-blur-xl">
       {hasWindow && <div className="hidden">
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
                playsinline={true}
                config={{
                    youtube: {
                        playerVars: { 
                            controls: 0,
                            modestbranding: 1,
                            playsinline: 1, 
                            origin: typeof window !== 'undefined' ? window.location.origin : undefined
                        }
                    }
                }}
            />
        </div>}

        <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner bg-black">
            <Image 
                src={finalCoverImage} 
                alt={songName || "Capa"} 
                fill 
                className={cn("object-cover transition-opacity duration-700", isReady ? "opacity-100" : "opacity-50")}
                unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex justify-between items-center px-1 pt-1">
            <div className="flex flex-col max-w-[80%]">
              <h3 className="text-white text-lg sm:text-xl font-bold truncate leading-tight">{songName || "Carregando..."}</h3>
              <p className="text-zinc-400 text-xs sm:text-sm font-medium truncate">{artistName || "Aguarde..."}</p>
            </div>
            <motion.div 
                animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8 }}
                onClick={handleManualPlayPause}
                className="cursor-pointer"
            >
                <Heart className={cn("w-6 h-6 sm:w-7 sm:h-7 transition-colors", isPlaying ? "fill-pink-500 text-pink-500" : "text-zinc-500")} />
            </motion.div>
        </div>

        <div className="px-1 space-y-1.5">
            <Slider 
                value={[progress * 100]} 
                max={100} 
                step={0.1}
                className="h-1.5 cursor-pointer py-2"
                onValueChange={handleSeek}
            />
            <div className="flex justify-between text-[10px] sm:text-xs text-zinc-500 font-mono tracking-tight">
                <span>{formatTime(currentTimeInSeconds)}</span>
                <span>-{formatTime(remainingTimeInSeconds)}</span>
            </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-1">
            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-zinc-300 hover:text-white" onClick={() => playerRef.current?.seekTo(progress - 0.1, 'fraction')}>
                    <SkipBack className="w-6 h-6" />
                </Button>
                
                <Button 
                    onClick={handleManualPlayPause} 
                    className="bg-white rounded-full w-14 h-14 flex items-center justify-center hover:scale-105 transition active:scale-95 shadow-xl hover:bg-zinc-200"
                >
                    {isPlaying ? (
                        <Pause className="text-black w-6 h-6 fill-black" /> 
                    ) : (
                        <Play className="text-black w-6 h-6 fill-black ml-1" />
                    )}
                </Button>
                
                <Button variant="ghost" size="icon" className="text-zinc-300 hover:text-white" onClick={() => playerRef.current?.seekTo(progress + 0.1, 'fraction')}>
                    <SkipForward className="w-6 h-6" />
                </Button>
            </div>

            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
        </div>
    </div>
  );
});

YoutubePlayer.displayName = 'YoutubePlayer';

export default YoutubePlayer;
