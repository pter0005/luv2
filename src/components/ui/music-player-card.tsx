
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import ReactPlayer from 'react-player/youtube';
import { Play, Pause } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

type MusicPlayerCardProps = {
  videoUrl: string;
};

const MusicPlayerCard = ({ videoUrl }: MusicPlayerCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = new URL(videoUrl).searchParams.get('v');
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border bg-card/80 p-4 shadow-lg group">
      <div className="relative w-full aspect-video rounded-md overflow-hidden">
        <Image
          src={thumbnailUrl}
          alt="Video thumbnail"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-primary/70 hover:bg-primary text-primary-foreground transition-transform group-hover:scale-110"
            >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </Button>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-primary-foreground truncate">Sua Música</h3>
        <p className="text-sm text-muted-foreground">YouTube</p>
      </div>
      <div className={cn("absolute opacity-0 pointer-events-none", isPlaying && "opacity-100")}>
        <ReactPlayer
          url={videoUrl}
          playing={isPlaying}
          onEnded={() => setIsPlaying(false)}
          width="0"
          height="0"
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default MusicPlayerCard;

    