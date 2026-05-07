"use client";

import Image from "next/image";
import { memo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Volume2, VolumeX, Play, Pause, Verified, Heart, X } from 'lucide-react';
import { useLocale } from 'next-intl';

// 22 prints reais de clientes — pasta /public/depoimentos.
const REAL_TESTIMONIALS = Array.from({ length: 22 }, (_, i) => ({
  src: `/depoimentos/depoimento-${String(i + 1).padStart(2, '0')}.png`,
  alt: `Depoimento real de cliente ${i + 1}`,
}));

const VIDEO_SRC = '/depoimentos/reacao-mae.mp4';

const TestimonialsSection = () => {
  const locale = useLocale();
  const isEN = locale === 'en';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

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
    <>
      <div className="relative w-full overflow-hidden py-16">
        <div className="container relative z-10 max-w-6xl mx-auto px-4">

          {/* ═══ HEADER ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
              style={{
                background: 'rgba(168,85,247,0.10)',
                borderColor: 'rgba(168,85,247,0.30)',
              }}>
              <Verified className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-300">
                {isEN ? 'Real reactions · Verified' : 'Reações reais · Verificadas'}
              </span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-[1.05]">
              {isEN ? 'Watch a mom' : 'Assiste uma mãe'}{' '}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                {isEN ? 'see her surprise.' : 'ver a surpresa.'}
              </span>
            </h2>
            <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto">
              {isEN
                ? 'No actors. No edits. Just real moments captured by real clients after they delivered the page.'
                : 'Sem atores. Sem edição. Só momentos reais capturados por clientes que entregaram a página.'}
            </p>
          </motion.div>

          {/* ═══ HERO VIDEO — gigante e cinematic ═══ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative max-w-4xl mx-auto mb-16"
          >
            {/* Glow halo cinematográfico */}
            <div className="absolute -inset-8 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-purple-500/30 blur-3xl -z-10 opacity-70" />

            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              style={{
                boxShadow: '0 40px 80px -25px rgba(168,85,247,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
              }}>

              {/* Tag "AO VIVO" pulsante */}
              <div className="absolute top-5 left-5 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/95 backdrop-blur-md shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white">
                  {isEN ? 'Real moment' : 'Momento real'}
                </span>
              </div>

              {/* Heart badge */}
              <div className="absolute top-5 right-5 z-10 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/20">
                <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              </div>

              {/* Video element — sem preload="metadata" pra carregar de fato.
                  bg gradient enquanto carrega evita black box vazio. */}
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full aspect-video object-cover cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
                }}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Bottom gradient overlay pra contraste dos controles */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

              {/* Controles do vídeo */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-3 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/25 hover:bg-white/25 transition-all"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="px-4 py-2.5 rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/25 hover:bg-white/25 transition-all flex items-center gap-2"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white">
                          {isEN ? 'Tap to listen' : 'Toque pra ouvir'}
                        </span>
                      </>
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
                <div className="hidden md:block px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                  <span className="text-[11px] font-medium text-white/85">
                    {isEN ? '23s · Real reaction' : '23s · Reação real'}
                  </span>
                </div>
              </div>
            </div>

            {/* Caption embaixo do vídeo */}
            <p className="text-center text-sm md:text-base text-zinc-400 mt-5 italic">
              {isEN
                ? '"She found out at lunch. We didn\'t even film on purpose."'
                : '"Mostrei pra ela no almoço. Nem era pra ter filmado."'}
            </p>
          </motion.div>

          {/* ═══ DIVISOR ═══ */}
          <div className="flex items-center gap-4 max-w-4xl mx-auto mb-10">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-white/15" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] ring-1 ring-white/10">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <span className="text-sm font-bold text-white">4.9</span>
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-400 font-medium">
                {isEN ? '+10.000 happy clients' : '+10.000 clientes felizes'}
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/15 to-white/15" />
          </div>

          {/* ═══ HEADLINE WALL ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
              {isEN ? 'Real WhatsApps from real clients' : 'Mensagens reais que recebemos no zap'}
            </h3>
            <p className="text-sm text-zinc-400">
              {isEN
                ? 'Direct screenshots — no edits, no actors.'
                : 'Prints diretos — sem edição, sem ator.'}
            </p>
          </motion.div>

          {/* ═══ MASONRY DOS PRINTS REAIS ═══
              CSS columns garante layout natural (não força quadrado, não corta msg).
              REDUZIDO pra 1/2/3 colunas — prints precisam de espaço pra ler. */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance] max-w-5xl mx-auto"
          >
            {REAL_TESTIMONIALS.map((t, i) => (
              <motion.button
                key={t.src}
                type="button"
                onClick={() => setLightbox(t.src)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
                className="group relative block w-full mb-4 md:mb-6 break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-white/10 hover:ring-purple-400/60 transition-all duration-300 hover:-translate-y-1 cursor-zoom-in"
                style={{
                  background: '#0a0a0a',
                  boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)',
                }}
              >
                <Image
                  src={t.src}
                  alt={t.alt}
                  width={400}
                  height={400}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                  unoptimized
                />
                {/* Verified badge no hover */}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md">
                    <Verified className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      {isEN ? 'Verified' : 'Verificado'}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* ═══ CTA FINAL ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center mt-16"
          >
            <p className="text-base md:text-lg text-zinc-300 text-center max-w-md mb-6">
              {isEN ? (
                <>Want to see <strong className="text-white">your loved one's reaction</strong> just like these?</>
              ) : (
                <>Quer ver <strong className="text-white">a reação de quem você ama</strong> igual a essas?</>
              )}
            </p>
            <a
              href="#planos"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all hover:scale-105 shadow-xl shadow-purple-500/40"
            >
              {isEN ? 'Create my surprise →' : 'Criar minha surpresa →'}
            </a>
          </motion.div>
        </div>
      </div>

      {/* ═══ LIGHTBOX — print em fullsize ao clicar ═══ */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 hover:bg-white/20 transition-all"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox}
              alt="Depoimento ampliado"
              width={1200}
              height={1200}
              className="w-full h-auto rounded-2xl ring-1 ring-white/10 object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
};

export default memo(TestimonialsSection);
