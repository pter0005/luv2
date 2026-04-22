"use client";

import Image from "next/image";
import TestimonialsMarquee from '@/components/layout/TestimonialsMarquee';
import { memo } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useLocale } from 'next-intl';

// Avatares reais dos depoimentos — mesmos do TestimonialsMarquee
const AVATAR_URLS = [
  "https://i.imgur.com/YnmbwMB.png",
  "https://i.imgur.com/DKzAqTc.png",
  "https://i.imgur.com/6EWde45.png",
  "https://i.imgur.com/kKN8SLq.png",
  "https://i.imgur.com/NHVZplW.png",
];

const TestimonialsSection = () => {
  const locale = useLocale();
  const isEN = locale === 'en';
  return (
    <div className="relative w-full overflow-hidden">
      <div className="container relative z-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          {/* Badge com avatares reais */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full mb-6"
            style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}>
            {/* Stack de avatares */}
            <div className="flex -space-x-2">
              {AVATAR_URLS.map((src, i) => (
                <div key={i} className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-black flex-shrink-0"
                  style={{ zIndex: AVATAR_URLS.length - i }}>
                  <Image src={src} alt="Casal feliz" width={28} height={28} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <span className="text-sm font-bold text-white">4.9</span>
              <span className="text-xs text-zinc-400">{isEN ? 'from 10,000+ couples' : 'de +10.000 casais'}</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            {isEN ? 'Real stories.' : 'Histórias reais.'}{' '}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
              {isEN ? 'Real emotions.' : 'Emoções de verdade.'}
            </span>
          </h2>
          <p className="text-base text-zinc-400 max-w-xl mx-auto">
            {isEN
              ? 'Over 10,000 couples have immortalized their stories. See what they\'re saying.'
              : 'Mais de 10.000 casais já eternizaram suas histórias. Veja o que eles estão dizendo.'}
          </p>

          {/* Rating bar visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-4 mt-6 px-6 py-3 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {(isEN
              ? [
                  { label: '5 stars', pct: 91 },
                  { label: '4 stars', pct: 7 },
                  { label: '3 or less', pct: 2 },
                ]
              : [
                  { label: '5 estrelas', pct: 91 },
                  { label: '4 estrelas', pct: 7 },
                  { label: '3 ou menos', pct: 2 },
                ]).map(({ label, pct }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 whitespace-nowrap w-20 text-right">{label}</span>
                <div className="w-20 h-1.5 rounded-full overflow-hidden bg-zinc-800">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: pct > 50 ? 'linear-gradient(90deg, #a855f7, #ec4899)' : 'rgba(255,255,255,0.2)' }}
                  />
                </div>
                <span className="text-xs font-bold text-zinc-400">{pct}%</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Marquee ── */}
        <TestimonialsMarquee />

        {/* ── CTA embaixo dos testimonials ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mt-10"
        >
          <p className="text-sm text-zinc-500 text-center max-w-sm">
            {isEN ? <>Join <strong className="text-white">10,000+ couples</strong> who already created amazing pages.{' '}</> : <>Junte-se a <strong className="text-white">+10.000 casais</strong>{' '}que já criaram páginas incríveis.{' '}</>}
            <a href="#planos" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors underline underline-offset-2">
              {isEN ? 'Create mine now →' : 'Criar a minha agora →'}
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default memo(TestimonialsSection);
