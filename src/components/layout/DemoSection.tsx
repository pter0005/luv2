"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { memo } from "react";

const DemoSection = () => {
    const { t, locale } = useTranslation();
    return (
        <section className="w-full py-16 px-4 flex justify-center items-center overflow-hidden">
            <div className="relative w-full max-w-[1400px] h-[550px] rounded-[3rem] overflow-hidden flex items-center justify-center border border-white/5 shadow-[0_0_80px_-20px_rgba(109,40,217,0.4)] group">
                
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a052b] via-[#0f021a] to-[#05000a] z-0"></div>
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none perspective-500">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] transform rotate-x-12 scale-150"></div>
                </div>
                
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-12 left-[20%] text-purple-300 opacity-60 z-10">
                   <Sparkles />
                </motion.div>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute bottom-20 right-[20%] text-pink-300 opacity-50 z-10">
                   <Zap />
                </motion.div>

                <div className="relative z-20 w-full h-full flex items-center justify-between px-4">
                    
                    <div className="hidden md:flex absolute -left-24 lg:-left-12 top-10 justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 120, rotateX: 10 }}
                            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative group perspective-1000 origin-center rotate-[-40deg] scale-[0.85] lg:scale-90">
                             <div className="relative w-[300px] h-[600px] rounded-[3.5rem] p-[6px] bg-gradient-to-br from-[#4a4a4a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl ring-1 ring-white/10">
                                <div className="relative w-full h-full bg-black rounded-[3.2rem] border-[8px] border-black overflow-hidden">
                                    <video className="w-full h-full object-cover scale-[1.02]" autoPlay loop muted playsInline src={locale === 'pt' ? "https://i.imgur.com/GHtKVNZ.mp4" : "https://res.cloudinary.com/dncoxm1it/video/upload/v1770309853/mmmmmmm_w3cnqn.mp4"}></video>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex-1 flex flex-col items-center text-center mx-auto z-30 max-w-4xl mt-[-20px]">
                        
                        <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">{t('home.demo.badge')}</span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/10 blur-[60px] rounded-full -z-10"></div>
                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">{t('home.demo.title.line1')}</span>
                                <span className="block text-4xl md:text-5xl font-light text-gray-400 my-2 tracking-normal italic font-serif opacity-80">{t('home.demo.title.line2')}</span>
                                <span className="relative inline-block">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 pb-2">{t('home.demo.title.line3')}</span>
                                </span>
                            </h2>
                        </motion.div>

                        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-6 text-gray-400 max-w-lg text-sm md:text-base font-medium leading-relaxed">
                            {t('home.demo.description1')}{' '}
                            <span className="text-white font-semibold">{t('home.demo.description2')}</span>.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-10">
                            <a target="_blank" rel="noopener noreferrer" href="https://mycupid.com.br/p/A0vASdM58tZ2BOMksqCB">
                                <button className="relative inline-flex h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-50 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] group hover:scale-105 transition-transform duration-300">
                                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]"></span>
                                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black/90 px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl gap-3">
                                      <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{t('home.demo.cta')}</span>
                                    </span>
                                </button>
                            </a>
                        </motion.div>
                    </div>

                    <div className="hidden md:flex absolute -right-24 lg:-right-12 top-10 justify-center">
                         <motion.div
                            initial={{ opacity: 0, y: 120, rotateX: 10 }}
                            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative group perspective-1000 origin-center rotate-[40deg] scale-[0.85] lg:scale-90">
                             <div className="relative w-[300px] h-[600px] rounded-[3.5rem] p-[6px] bg-gradient-to-br from-[#4a4a4a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl ring-1 ring-white/10">
                                <div className="relative w-full h-full bg-black rounded-[3.2rem] border-[8px] border-black overflow-hidden">
                                    <video className="w-full h-full object-cover scale-[1.02]" autoPlay loop muted playsInline src="https://i.imgur.com/t7ICxbN.mp4"></video>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default memo(DemoSection);
