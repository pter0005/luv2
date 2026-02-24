"use client";

import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  Play,
  Palette,
  MessageCircle,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from "framer-motion";
import { useTranslation } from '@/lib/i18n';
import FloatingHeart from './FloatingHeart';


const HeroSection = () => {
  const { t, locale } = useTranslation();
  const heroRef = useRef(null);

  const phrases = useMemo(() => [t('home.hero.subtitle.animated.1'), t('home.hero.subtitle.animated.2'), t('home.hero.subtitle.animated.3')], [t]);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const typeSpeed = isDeleting ? 40 : 80;
    const delayBeforeDelete = 2000;

    const handleTyping = () => {
      if (!isDeleting) {
        if (typedPhrase.length < currentPhrase.length) setTypedPhrase(currentPhrase.slice(0, typedPhrase.length + 1));
        else setTimeout(() => setIsDeleting(true), delayBeforeDelete);
      } else {
        if (typedPhrase.length > 0) setTypedPhrase(currentPhrase.slice(0, typedPhrase.length - 1));
        else { setIsDeleting(false); setPhraseIndex((prev) => (prev + 1) % phrases.length); }
      }
    };
    const timer = setTimeout(handleTyping, typeSpeed);
    return () => clearTimeout(timer);
  }, [typedPhrase, isDeleting, phraseIndex, phrases]);

  return (
    <section ref={heroRef} className="relative w-full overflow-hidden flex items-center justify-center min-h-[100dvh] py-12 lg:py-0">
        <div className="container flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 items-center relative z-10 h-full">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left pt-0 relative z-20 order-2 lg:order-1">
                 <div className="hidden lg:inline-flex items-center gap-3 bg-zinc-900/80 border border-white/10 rounded-full py-2 px-4 mb-6 shadow-lg">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0112] overflow-hidden bg-gray-800">
                                <Image src={`https://picsum.photos/seed/love${i}/100/100`} alt="User" width={32} height={32} className="object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{t('home.hero.join')}</span>
                        <span className="text-sm font-bold text-white">{t('home.hero.couples')}</span>
                    </div>
                 </div>

                 <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-white font-display leading-[1.1] mb-6 min-h-[120px] lg:min-h-[auto]">
                    {t('home.hero.title.line1')} <br />
                    <span className="relative inline-block mt-2">
                        <span className="font-handwriting text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 text-5xl lg:text-7xl pb-4">
                            {typedPhrase}
                            <span className="animate-blink text-purple-400 ml-1">|</span>
                        </span>
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-purple-500 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </span>
                </h1>

                <p className="text-base lg:text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed font-light">
                    {t('home.hero.description')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/login?redirect=/criar" className="w-full sm:w-auto">
                        <Button size="xl" className="w-full sm:w-auto bg-white text-black hover:bg-purple-50 font-bold text-lg px-8 py-6 rounded-full shadow-lg">
                            {t('home.hero.cta')} <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="#demo-section" className="w-full sm:w-auto">
                         <Button variant="ghost" size="xl" className="w-full sm:w-auto text-white border border-white/10 rounded-full px-8 py-6 hover:bg-white/5">
                            <Play className="w-4 h-4 mr-2 fill-white" /> {t('home.hero.example')}
                        </Button>
                    </Link>
                </div>
            </div>
            
            <div className="flex flex-col items-center w-full order-1 lg:order-2">
                <div className="inline-flex lg:hidden items-center gap-2 bg-zinc-900/80 border border-white/10 rounded-full py-1.5 px-3 mb-2 shadow-lg">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0112] overflow-hidden bg-gray-800">
                                <Image src={`https://picsum.photos/seed/love${i}/100/100`} alt="User" width={24} height={24} className="object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">{t('home.hero.join')}</span>
                        <span className="text-xs font-bold text-white">{t('home.hero.couples')}</span>
                    </div>
                </div>

                <div className="relative h-[500px] sm:h-[600px] lg:h-[500px] w-full flex items-center justify-center perspective-[1200px] mt-[-2rem] sm:mt-0">
                    <div className="relative w-full max-w-[500px] h-[600px] flex items-center justify-center scale-[0.8] md:scale-100 transition-transform duration-300 transform-gpu will-change-transform">
                        <motion.div
                            initial={{ opacity: 0, x: 0 }}
                            whileInView={{ opacity: 1, x: -90, y: 30, rotate: -15 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                            className="absolute z-10 brightness-[0.5] hover:z-40 hover:brightness-100 hover:scale-105 transition-all duration-500 origin-bottom-right"
                        >
                            <div className="w-[240px] h-[500px] rounded-[2.5rem] border-[6px] border-[#121212] bg-black overflow-hidden shadow-2xl">
                                <video 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    poster="https://i.imgur.com/FxHuXVb.png"
                                    src="https://res.cloudinary.com/dncoxm1it/video/upload/v1770329588/bvcxasdd_ew3u0l.mp4" 
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 0 }}
                            whileInView={{ opacity: 1, x: 90, y: 30, rotate: 15 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                            className="absolute z-10 brightness-[0.5] hover:z-40 hover:brightness-100 hover:scale-105 transition-all duration-500 origin-bottom-left"
                        >
                            <div className="w-[240px] h-[500px] rounded-[2.5rem] border-[6px] border-[#121212] bg-black overflow-hidden shadow-2xl">
                                <video 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    poster="https://i.imgur.com/t7ICxbN.png"
                                    src="https://i.imgur.com/t7ICxbN.mp4" 
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                            className="relative z-30"
                        >
                            <motion.div
                            animate={{ y: [0, 15, 0]}}
                            transition={{ duration: 6, ease: "easeInOut", repeat: Infinity}}
                            >
                            <div className="w-[280px] h-[580px] rounded-[3.5rem] border-[8px] border-[#1a1a1a] bg-black overflow-hidden shadow-[0_20px_70px_-20px_rgba(168,85,247,0.5)] ring-1 ring-white/20">
                                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-full z-40 ring-1 ring-white/10 flex items-center justify-center">
                                    <div className="w-16 h-full bg-zinc-900/50 rounded-full blur-[1px]"></div>
                                </div>
                                <video 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    poster="https://i.imgur.com/GHtKVNZ.png"
                                    src={locale === 'pt' ? "https://i.imgur.com/GHtKVNZ.mp4" : "https://res.cloudinary.com/dncoxm1it/video/upload/v1770309853/mmmmmmm_w3cnqn.mp4"}
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-40 pointer-events-none"></div>
                            </div>
                            </motion.div>
                        </motion.div>

                        <FloatingHeart className="top-[10%] left-[15%]" delay={0} />
                        <FloatingHeart className="top-[5%] right-[15%]" delay={1.2} />
                        <FloatingHeart className="bottom-[10%] left-[20%]" delay={2.4} />
                        <FloatingHeart className="bottom-[5%] right-[20%]" delay={3.6} />


                        <motion.div 
                            initial={{ opacity: 0, x: -30 }} 
                            whileInView={{ opacity: 1, x: 0 }} 
                            transition={{ delay: 0.5 }}
                            className="absolute -left-[140px] md:-left-[200px] top-[10%] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 py-3 px-4 rounded-2xl shadow-2xl flex items-center gap-3 z-40 hover:scale-105 transition-transform"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                <MessageCircle size={18} className="text-green-400" />
                                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e] border border-black"></div>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t('home.hero.support')}</p>
                                <p className="text-sm text-white font-bold">Online 24/7</p>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 30 }} 
                            whileInView={{ opacity: 1, x: 0 }} 
                            transition={{ delay: 0.7 }}
                            className="absolute -right-[120px] md:-right-[180px] bottom-[10%] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 py-4 px-5 rounded-2xl shadow-2xl z-40 flex flex-col items-center hover:scale-105 transition-transform"
                        >
                            <div className="absolute -top-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                <Palette size={10} /> {t('home.hero.customDesign')}
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                                {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-purple-500 text-purple-500" />)}
                            </div>
                            <p className="text-xs text-white font-bold">{t('home.hero.userRating')}</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
      </section>
  );
};

export default HeroSection;
