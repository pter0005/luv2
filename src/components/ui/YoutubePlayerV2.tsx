"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, useCallback } from "react";
import ReactPlayer from "react-player/youtube";
import { Play, Pause, Volume2, VolumeX, Music2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface YoutubePlayerV2Props {
  url: string;
  songName?: string;
  artistName?: string;
  coverImage?: string;
  volume?: number;
  autoplay?: boolean;
  onMusicActive?: () => void;
}

const getYoutubeThumbnail = (url: string) => {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[7].length === 11) ? match[7] : false;
  return videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null;
};

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};

const YoutubePlayerV2 = React.forwardRef<any, YoutubePlayerV2Props>(({
  url,
  songName,
  artistName,
  coverImage,
  volume = 0.6,
  autoplay = true,
  onMusicActive,
}, ref) => {
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hover, setHover] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const autoplayAttempted = useRef(false);
  const musicActiveRef = useRef(false);

  const thumbnailUrl = getYoutubeThumbnail(url);
  const cover = coverImage || thumbnailUrl || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1000";

  useEffect(() => { setMounted(true); }, []);

  // Try to autoplay muted as soon as ready. Browsers allow muted autoplay.
  useEffect(() => {
    if (!isReady || autoplayAttempted.current || !autoplay) return;
    autoplayAttempted.current = true;
    setIsPlaying(true);
  }, [isReady, autoplay]);

  // Notify parent when music is confirmed playing with sound.
  useEffect(() => {
    if (isPlaying && !isMuted && !musicActiveRef.current) {
      musicActiveRef.current = true;
      onMusicActive?.();
    }
  }, [isPlaying, isMuted, onMusicActive]);

  // Helper: call YouTube iframe API directly (sync, works within user gesture).
  const forceYTPlay = useCallback(() => {
    try {
      const internal = (playerRef.current as any)?.getInternalPlayer?.();
      if (!internal) return false;
      if (internal.unMute) internal.unMute();
      if (internal.setVolume) internal.setVolume((volume ?? 0.6) * 100);
      if (internal.playVideo) internal.playVideo();
      return true;
    } catch { return false; }
  }, [volume]);

  // Unmute on ANY user interaction anywhere on the page.
  // Calls YouTube API directly (synchronous within gesture) for iOS compatibility.
  // Keeps retrying on each click until player is ready and unmuted.
  useEffect(() => {
    if (!isMuted) return;
    if (!mounted) return;
    const tryUnmute = () => {
      const ok = forceYTPlay();
      if (ok) {
        setIsMuted(false);
        setIsPlaying(true);
        setBlocked(false);
      }
      // If !ok, player not loaded yet — listener stays, next click retries.
    };
    window.addEventListener('pointerdown', tryUnmute);
    window.addEventListener('touchstart', tryUnmute);
    return () => {
      window.removeEventListener('pointerdown', tryUnmute);
      window.removeEventListener('touchstart', tryUnmute);
    };
  }, [isMuted, mounted, forceYTPlay]);

  useImperativeHandle(ref, () => ({
    play: async () => {
      setIsMuted(false);
      setIsPlaying(true);
      setBlocked(false);
      forceYTPlay();
    }
  }), [forceYTPlay]);

  const toggle = useCallback(() => {
    setIsMuted(false);
    setIsPlaying(prev => !prev);
    setBlocked(false);
  }, []);

  const onReady = useCallback(() => setIsReady(true), []);
  const onPlay = useCallback(() => { setIsPlaying(true); setBlocked(false); }, []);
  const onPause = useCallback(() => setIsPlaying(false), []);
  const onDuration = useCallback((d: number) => setDuration(d), []);
  const onProgress = useCallback((s: { played: number }) => setProgress(s.played), []);
  const onError = useCallback(() => { setBlocked(true); setIsPlaying(false); }, []);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    playerRef.current?.seekTo(pct, 'fraction');
    setProgress(pct);
    if (!isPlaying) {
      setIsMuted(false);
      setIsPlaying(true);
    }
  };

  const currentSec = duration * progress;
  const pctDisplay = progress * 100;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Hidden react-player */}
      {mounted && (
        <div className="hidden">
          <ReactPlayer
            ref={playerRef}
            url={url}
            playing={isPlaying}
            volume={volume}
            muted={isMuted}
            onReady={onReady}
            onPlay={onPlay}
            onPause={onPause}
            onDuration={onDuration}
            onProgress={onProgress}
            onError={onError}
            width="0"
            height="0"
            playsinline
            config={{
              playerVars: {
                controls: 0,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                origin: typeof window !== 'undefined' ? window.location.origin : undefined,
              },
            }}
          />
        </div>
      )}

      {/* Glassy card */}
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-black/70 via-zinc-900/70 to-black/70 backdrop-blur-2xl shadow-2xl shadow-black/50 p-4"
      >
        {/* Blurred cover halo */}
        <div className="absolute inset-0 -z-10 opacity-40">
          <Image src={cover} alt="" fill className="object-cover blur-2xl scale-125" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/80" />
        </div>

        <div className="flex items-center gap-4">
          {/* Cover */}
          <div className="relative shrink-0">
            <motion.div
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={isPlaying ? { repeat: Infinity, duration: 20, ease: 'linear' } : { duration: 0.4 }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-xl border border-white/20"
            >
              <Image src={cover} alt={songName || 'Capa'} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40" />
            </motion.div>
            {/* Glow ring when playing */}
            {isPlaying && (
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-pink-500/50 via-fuchsia-500/50 to-purple-500/50 blur-xl -z-10 animate-pulse" />
            )}
          </div>

          {/* Info + controls */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Music2 className="w-3 h-3 text-pink-300 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-pink-300/80 font-semibold">Nossa música</span>
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
              {songName || 'Sua música'}
            </h3>
            <p className="text-white/60 text-xs sm:text-sm truncate mb-3">
              {artistName || ''}
            </p>

            {/* Progress bar */}
            <div
              ref={progressBarRef}
              onClick={seek}
              className="relative h-1.5 rounded-full bg-white/10 cursor-pointer group/bar"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-rose-400 transition-[width] duration-300 ease-linear"
                style={{ width: `${pctDisplay}%` }}
              />
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg transition-opacity",
                  (hover || isPlaying) ? "opacity-100" : "opacity-0"
                )}
                style={{ left: `${pctDisplay}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-white/50 font-mono tabular-nums">
              <span>{fmt(currentSec)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>

        {/* Bottom action row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsMuted(m => !m)}
            aria-label={isMuted ? 'Desmutar' : 'Mutar'}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-xs font-medium"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'Sem som' : 'Som ligado'}</span>
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? 'Pausar' : 'Tocar'}
            className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/50 hover:scale-105 active:scale-95 transition-transform"
          >
            {!isPlaying && isReady && (
              <span className="absolute inset-0 rounded-full bg-pink-500/40 animate-ping" />
            )}
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-white relative z-10" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white relative z-10 ml-0.5" />
            )}
          </button>

          <div className="w-16 text-right">
            {!isReady && (
              <span className="text-[10px] text-white/40">Carregando...</span>
            )}
            {isReady && isMuted && isPlaying && (
              <span className="text-[10px] text-pink-300 animate-pulse">toque p/ som</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

YoutubePlayerV2.displayName = 'YoutubePlayerV2';

export default YoutubePlayerV2;
