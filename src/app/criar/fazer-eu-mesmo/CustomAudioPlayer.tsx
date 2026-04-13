'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};

export default function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => { setIsPlaying(false); setCurrent(0); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (e) {
      console.warn('[CustomAudioPlayer] play error', e);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrent(audio.currentTime);
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-gradient-to-br from-pink-500/20 via-fuchsia-500/15 to-rose-500/20 backdrop-blur-xl border border-pink-500/30 shadow-2xl shadow-pink-500/20 p-4 overflow-hidden">
      <audio ref={audioRef} src={src} preload="metadata" playsInline className="hidden" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? 'Pausar' : 'Tocar'}
          className="relative shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/50 transition-transform hover:scale-105 active:scale-95"
        >
          {!isPlaying && (
            <span className="absolute inset-0 rounded-full bg-pink-500/40 animate-ping" />
          )}
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white fill-white relative z-10" />
          ) : (
            <Play className="w-5 h-5 text-white fill-white relative z-10 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Mic className="w-3 h-3 text-pink-300" />
            <span className="text-xs font-semibold text-white/90 truncate">Mensagem de voz</span>
          </div>
          <div
            ref={progressRef}
            onClick={seek}
            className="relative h-2 rounded-full bg-white/10 cursor-pointer group"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-400 transition-all duration-100"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-white/60 font-mono tabular-nums">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
