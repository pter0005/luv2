"use client";

import Image from "next/image";
import { memo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Volume2, VolumeX, Play, Heart, Verified } from 'lucide-react';
import { useLocale } from 'next-intl';

// 22 prints reais de clientes — pasta /public/depoimentos.
// Conteúdo: agradecimentos do zap após receberem páginas. Diversidade de
// reações: mãe amou, namorada chorou, etc. Anonimizado naturalmente
// (são prints só da bolha, sem foto/numero).
const REAL_TESTIMONIALS = Array.from({ length: 22 }, (_, i) => ({
  src: `/depoimentos/depoimento-${String(i + 1).padStart(2, '0')}.png`,
  alt: `Depoimento real de cliente ${i + 1}`,
}));

const TestimonialsSection = () => {
  const locale = useLocale();
  const isEN = locale === 'en';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="relative w-full overflow-hidden py-8">
      <div className="container relative z-10 max-w-7xl mx-auto px-4">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          {/* Badge "Verificado" */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.3)',
            }}>
            <Verified className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              {isEN ? 'Real reactions · 100% verified' : 'Reações reais · 100% verificadas'}
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            {isEN ? 'No edits.' : 'Sem edição.'}{' '}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
              {isEN ? 'Just real love.' : 'Só amor de verdade.'}
            </span>
          </h2>
          <p className="text-base text-zinc-400 max-w-xl mx-auto mb-6">
            {isEN
              ? "Real screenshots from clients' WhatsApp after they delivered the surprise. The reaction speaks for itself."
              : 'Prints reais do zap dos clientes depois que entregaram a surpresa. A reação fala por si.'}
          </p>

          {/* Stars + count */}
          <div className="inline-flex items-center gap-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <span className="text-lg font-bold text-white">4.9</span>
            <span className="text-sm text-zinc-400">
              {isEN ? '· 10,000+ surprises delivered' : '· +10.000 surpresas entregues'}
            </span>
          </div>
        </motion.div>

        {/* ── VÍDEO HERO (REAÇÃO REAL) ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-2xl mx-auto mb-12 rounded-3xl overflow-hidden shadow-2xl"
          style={{
            boxShadow: '0 25px 60px -20px rgba(168,85,247,0.4), 0 0 0 1px rgba(168,85,247,0.15)',
          }}
        >
          {/* Glow halo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl -z-10" />

          {/* Tag "Reação ao vivo" */}
          <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {isEN ? 'Real reaction' : 'Reação real'}
            </span>
          </div>

          {/* Heart badge */}
          <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
          </div>

          <video
            ref={videoRef}
            src="/depoimentos/reacao-mae.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full aspect-video object-cover bg-black cursor-pointer"
            onClick={togglePlay}
          />

          {/* Controles do vídeo */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/20 hover:bg-black/80 transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <Play className={`w-4 h-4 text-white ${isPlaying ? 'opacity-50' : ''}`} fill={isPlaying ? 'transparent' : 'white'} />
            </button>
            <button
              onClick={toggleMute}
              className="p-3 rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/20 hover:bg-black/80 transition-all"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* CTA flutuante "ouça com som" */}
          {isMuted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-purple-500/90 backdrop-blur-md cursor-pointer"
              onClick={toggleMute}
            >
              <span className="text-xs font-bold text-white">
                {isEN ? '🔊 Tap to listen' : '🔊 Toque pra ouvir'}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* ── GRID DOS PRINTS REAIS (22 prints) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
        >
          {REAL_TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.src}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: (i % 5) * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-white/5 hover:ring-purple-500/40 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: '#0a0a0a',
                boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
              }}
            >
              <Image
                src={t.src}
                alt={t.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Heart no hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-1.5 rounded-full bg-pink-500/90 backdrop-blur-md">
                  <Heart className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              {/* Verified badge */}
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-md">
                  <Verified className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {isEN ? 'Real' : 'Real'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── CTA FINAL ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center mt-12"
        >
          <p className="text-base text-zinc-300 text-center max-w-md mb-4">
            {isEN ? (
              <>
                Want to see <strong className="text-white">your loved one's reaction</strong> just like these?
              </>
            ) : (
              <>
                Quer ver <strong className="text-white">a reação de quem você ama</strong> igual a essas?
              </>
            )}
          </p>
          <a
            href="#planos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
          >
            {isEN ? 'Create my surprise →' : 'Criar minha surpresa →'}
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default memo(TestimonialsSection);
