"use client";

import Image from "next/image";
import { memo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Verified, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';

const REAL_TESTIMONIALS = Array.from({ length: 22 }, (_, i) => ({
  src: `/depoimentos/depoimento-${String(i + 1).padStart(2, '0')}.png`,
  alt: `Depoimento real de cliente ${i + 1}`,
}));

const VIDEO_SRC = '/depoimentos/reacao-mae.mp4';

const TestimonialsSection = () => {
  const locale = useLocale();
  const isEN = locale === 'en';
  const [lightbox, setLightbox] = useState<string | 'video' | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const totalSlides = 1 + REAL_TESTIMONIALS.length;

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const slideWidth = el.scrollWidth / totalSlides;
        const idx = Math.round(el.scrollLeft / slideWidth);
        setActiveIdx(Math.max(0, Math.min(totalSlides - 1, idx)));
      }, 100);
    };
    el.addEventListener('scroll', onScroll);
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(timer); };
  }, [totalSlides]);

  const scrollToIdx = (idx: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const slideWidth = el.scrollWidth / totalSlides;
    el.scrollTo({ left: idx * slideWidth, behavior: 'smooth' });
  };

  const next = () => scrollToIdx(Math.min(totalSlides - 1, activeIdx + 1));
  const prev = () => scrollToIdx(Math.max(0, activeIdx - 1));

  return (
    <>
      <div className="relative w-full overflow-hidden py-16">
        <div className="container relative z-10 max-w-3xl mx-auto px-4">

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

          {/* ═══ CAROUSEL ═══ 1 card por view, sem bordas pretas */}
          <div className="relative max-w-md mx-auto">
            {/* Botão prev (desktop) */}
            <button
              type="button"
              onClick={prev}
              disabled={activeIdx === 0}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 z-20 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md ring-1 ring-white/15 items-center justify-center hover:bg-black/90 hover:ring-purple-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={activeIdx === totalSlides - 1}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 z-20 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md ring-1 ring-white/15 items-center justify-center hover:bg-black/90 hover:ring-purple-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>

            {/* Carousel: items-start pra cards alinharem topo (não esticam) */}
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory items-start scrollbar-hide pb-2"
              style={{
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* CARD VÍDEO — primeiro slide */}
              <div className="shrink-0 snap-center w-full">
                <motion.button
                  type="button"
                  onClick={() => setLightbox('video')}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="group relative block w-full aspect-[9/16] overflow-hidden rounded-3xl ring-2 ring-purple-400/40 hover:ring-purple-400/80 transition-all cursor-pointer"
                  style={{
                    boxShadow: '0 16px 40px -12px rgba(168,85,247,0.5)',
                  }}
                >
                  {/* autoPlay+muted+loop = mostra frames como thumbnail (não preto) */}
                  <video
                    src={VIDEO_SRC}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 group-hover:from-black/85 transition-all" />

                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/95 backdrop-blur-md shadow-lg">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                      {isEN ? 'Real' : 'Real'}
                    </span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 shadow-2xl">
                      <Play className="w-11 h-11 text-white fill-white ml-1.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                    <p className="text-base font-bold text-white mb-1">
                      {isEN ? '🎬 Watch the reaction' : '🎬 Veja a reação'}
                    </p>
                    <p className="text-sm text-white/85 leading-tight">
                      {isEN ? 'Reaction video (23s)' : 'Vídeo da reação (23s)'}
                    </p>
                  </div>
                </motion.button>
              </div>

              {/* PRINTS — cada um com altura NATURAL da imagem (sem letterbox) */}
              {REAL_TESTIMONIALS.map((t, i) => (
                <div key={t.src} className="shrink-0 snap-center w-full">
                  <motion.button
                    type="button"
                    onClick={() => setLightbox(t.src)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
                    className="group relative block w-full overflow-hidden rounded-3xl ring-1 ring-white/10 hover:ring-purple-400/60 transition-all cursor-zoom-in"
                    style={{
                      boxShadow: '0 12px 30px -8px rgba(0,0,0,0.6)',
                    }}
                  >
                    {/* Image em altura natural — sem aspect ratio forçado, sem fundo preto */}
                    <Image
                      src={t.src}
                      alt={t.alt}
                      width={500}
                      height={500}
                      sizes="(max-width: 640px) 90vw, 448px"
                      className="block w-full h-auto"
                      loading={i < 3 ? 'eager' : 'lazy'}
                      unoptimized
                    />
                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md">
                        <Verified className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          {isEN ? 'Verified' : 'Verificado'}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                </div>
              ))}
            </div>

            {/* Indicador */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <span className="text-xs text-zinc-400 font-medium">
                <strong className="text-white text-sm">{activeIdx + 1}</strong>
                <span className="mx-1.5 text-zinc-600">/</span>
                <span>{totalSlides}</span>
              </span>
              <span className="text-xs text-zinc-600 ml-3">
                {isEN ? '· Swipe' : '· Arrasta pro lado'}
              </span>
            </div>
          </div>

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

      {/* Lightbox */}
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
                preload="auto"
                className="w-full h-auto rounded-2xl ring-1 ring-white/10 max-h-[85vh]"
              />
            ) : (
              <Image
                src={lightbox}
                alt="Depoimento ampliado"
                width={1200}
                height={1200}
                className="w-full h-auto rounded-2xl ring-1 ring-white/10"
                unoptimized
              />
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
};

export default memo(TestimonialsSection);
