'use client';

import { convertVideoToAudio } from '@/ai/flows/youtube-to-audio';
import { Loader2, Pause, Play } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!url) return;

    const fetchAudio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await convertVideoToAudio({ url });
        setAudioSrc(result.media);
      } catch (err) {
        console.error('Error converting video to audio:', err);
        setError('Não foi possível carregar o áudio.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudio();
  }, [url]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play error:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-xs mx-auto bg-card/80 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border border-border/60 min-h-[150px]">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted-foreground mt-4">Processando áudio...</p>
      </div>
    );
  }

  if (error) {
    return (
       <div className="w-full max-w-xs mx-auto bg-destructive/20 text-destructive-foreground rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border border-destructive/60 min-h-[150px]">
        <p className="text-sm text-center">{error}</p>
      </div>
    )
  }

  if (!audioSrc) return null;

  return (
    <div className="w-full max-w-xs mx-auto bg-card/80 rounded-2xl shadow-lg p-6 flex flex-col items-center border border-border/60">
       <style>{`
        .progress-bar {
            --progress: ${duration > 0 ? (currentTime / duration) * 100 : 0}%;
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
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <div className="w-full">
        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground mb-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="progress-bar w-full"
        />
      </div>
      <Button
        onClick={handlePlayPause}
        variant="ghost"
        size="icon"
        className="w-16 h-16 rounded-full bg-primary text-primary-foreground mt-4"
      >
        {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
      </Button>
    </div>
  );
};

export default MusicPlayerCard;
