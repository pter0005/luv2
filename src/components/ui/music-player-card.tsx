
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player/youtube';
import Image from 'next/image';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '00:00';
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  if (hh) {
    return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
  }
  return `${mm}:${ss}`;
};

const MusicPlayerCard = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [metadata, setMetadata] = useState({ title: 'Sua Música', author: 'Artista', thumbnail: '' });

  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    setIsClient(true);
    try {
        const videoId = new URL(url).searchParams.get('v');
        if (videoId) {
            setMetadata(prev => ({
                ...prev,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            }));
        }
    } catch(e) {
        console.error("Invalid YouTube URL for thumbnail", e);
    }
  }, [url]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    setPlayed(state.played);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    playerRef.current?.seekTo(newPlayed);
  };
  
  if (!isClient) {
    return (
        <div className="w-full max-w-sm mx-auto bg-card/80 rounded-2xl shadow-lg p-4 border border-border/60 animate-pulse">
            <div className="relative h-40 w-full mb-4 bg-muted rounded-lg"></div>
            <div className="text-center mb-4">
                <div className="h-6 w-3/4 bg-muted rounded-md mx-auto mb-2"></div>
                <div className="h-4 w-1/2 bg-muted rounded-md mx-auto"></div>
            </div>
             <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-1.5"></div>
                 <div className="flex justify-between text-xs">
                  <div className="h-3 w-8 bg-muted rounded-md"></div>
                  <div className="h-3 w-8 bg-muted rounded-md"></div>
                </div>
            </div>
             <div className="flex items-center justify-center gap-4 mt-4">
                 <div className="h-10 w-10 bg-muted rounded-full"></div>
                 <div className="h-14 w-14 bg-muted rounded-full"></div>
                 <div className="h-10 w-10 bg-muted rounded-full"></div>
            </div>
        </div>
    );
  }

  const playedSeconds = duration * played;

  return (
    <div className="w-full max-w-sm mx-auto bg-card/80 rounded-2xl shadow-lg p-4 border border-border/60">
      <div className="relative h-40 w-full mb-4">
        {metadata.thumbnail ? (
            <Image
                src={metadata.thumbnail}
                alt="Album Art"
                fill
                className="rounded-lg object-cover"
            />
        ) : (
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
              <p className='text-muted-foreground text-sm'>Sem prévia</p>
            </div>
        )}
      </div>

      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-foreground truncate">{metadata.title}</h3>
        <p className="text-sm text-muted-foreground">{metadata.author}</p>
      </div>

      <div className="space-y-2">
         <input
            type="range" min={0} max={0.999999} step="any"
            value={played}
            onChange={handleSeekChange}
            className="w-full h-1.5 appearance-none cursor-pointer range-slider rounded-full"
            style={{
                background: `linear-gradient(to right, hsl(var(--primary)) ${played * 100}%, hsl(var(--muted)) ${played * 100}%)`
            }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(playedSeconds)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground" disabled>
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button
          onClick={handlePlayPause}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-14 w-14 p-0 shadow-lg"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground" disabled>
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

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
       <style jsx>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: hsl(var(--primary-foreground));
          border: 2px solid hsl(var(--primary));
          border-radius: 50%;
          cursor: pointer;
          margin-top: -6px;
        }
        .range-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          background: hsl(var(--primary-foreground));
          border: 2px solid hsl(var(--primary));
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default MusicPlayerCard;
