"use client";

import Image from "next/image";
import { memo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Verified, Play, X } from 'lucide-react';
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
  // Lightbox: string pra print, 'video' pra vídeo, null pra fechado.
  const [lightbox, setLightbox] = useState<string | 'video' | null>(null);

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
              {isEN ? 'Sem edição.' : 'Sem edição.'}{' '}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                {isEN ? 'Just real love.' : 'Só amor de verdade.'}
              </span>
            </h2>
            <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-5">
              {isEN
                ? 'No actors. No edits. Just real moments captured by real clients.'
                : 'Sem atores. Sem edição. Só momentos reais de clientes que entregaram a página.'}
            </p>

            {/* Stars + count compacto */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] ring-1 ring-white/10">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <span className="text-sm font-bold text-white">4.9</span>
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-400 font-medium">
                {isEN ? '+10.000 happy clients' : '+10.000 clientes felizes'}
              </span>
            </div>
          </motion.div>

          {/* ═══ MASONRY GRID — vídeo é o PRIMEIRO card, prints depois ═══
              CSS columns garante layout natural (não força quadrado, não corta msg). */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance] max-w-5xl mx-auto"
          >
            {/* CARD VÍDEO — primeiro do grid, mesmo formato dos prints + botão play */}
            <motion.button
              type="button"
              onClick={() => setLightbox('video')}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4 }}
              className="group relative block w-full mb-4 md:mb-6 break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-purple-400/30 hover:ring-purple-400/70 transition-all duration-300 hover:-translate-y-1 cursor-pointer aspect-[9/16]"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))',
                boxShadow: '0 12px 30px -8px rgba(168,85,247,0.4)',
              }}
            >
              {/* Video thumbnail (frame inicial) */}
              <video
                src={VIDEO_SRC}
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Overlay escuro pra contraste do play */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40 group-hover:from-black/80 transition-all" />

              {/* Tag "REAÇÃO REAL" pulsante */}
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/95 backdrop-blur-md shadow-lg">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  {isEN ? 'Real' : 'Real'}
                </span>
              </div>

              {/* Botão play GIGANTE no centro */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 shadow-2xl">
                  <Play className="w-9 h-9 text-white fill-white ml-1" />
                </div>
              </div>

              {/* Caption no rodapé */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <p className="text-sm font-bold text-white mb-1">
                  {isEN ? '🎬 Watch the reaction' : '🎬 Veja a reação'}
                </p>
                <p className="text-xs text-white/85 leading-tight">
                  {isEN
                    ? 'A mom seeing her surprise (23s)'
                    : 'Mãe vendo a surpresa (23s)'}
                </p>
              </div>
            </motion.button>

            {/* PRINTS REAIS */}
            {REAL_TESTIMONIALS.map((t, i) => (
              <motion.button
                key={t.src}
                type="button"
                onClick={() => setLightbox(t.src)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.4, delay: ((i + 1) % 4) * 0.05 }}
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
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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

      {/* ═══ LIGHTBOX — vídeo OU print ampliado ═══ */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 hover:bg-white/20 transition-all z-10"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            {lightbox === 'video' ? (
              <video
                src={VIDEO_SRC}
                autoPlay
                controls
                playsInline
                className="w-full h-auto rounded-2xl ring-1 ring-white/10 max-h-[85vh]"
              />
            ) : (
              <Image
                src={lightbox}
                alt="Depoimento ampliado"
                width={1200}
                height={1200}
                className="w-full h-auto rounded-2xl ring-1 ring-white/10 object-contain"
                unoptimized
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(TestimonialsSection);
