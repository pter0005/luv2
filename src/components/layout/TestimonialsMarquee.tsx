
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star, Quote, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useMemo } from "react";

// --- DADOS REAIS & HUMANIZADOS (Gírias + Linguagem Jovem) ---
const testimonialImages = [
    // --- LINHA DE CIMA ---
    "https://i.imgur.com/cCguFSg.png",
    "https://i.imgur.com/FaY4ns0.png",
    "https://i.imgur.com/qhAqK7e.png",
    "https://i.imgur.com/cNpWi4g.png",
    "https://i.imgur.com/07VjZa7.png",
    "https://i.imgur.com/FRq4i5M.png",
    "https://i.imgur.com/3rZyoEl.png",
    "https://i.imgur.com/8MOjQPN.png",
    "https://i.imgur.com/aVr6GQy.png",
    "https://i.imgur.com/qZDukLz.png",
    // --- LINHA DE BAIXO ---
    "https://i.imgur.com/cGnkhbQ.png",
    "https://i.imgur.com/cGnkhbQ.png",
    "https://i.imgur.com/3YZF9hP.png",
    "https://i.imgur.com/7uImOdI.png",
    "https://i.imgur.com/qW4HUg2.png",
    "https://i.imgur.com/cCguFSg.png",
    "https://i.imgur.com/FaY4ns0.png",
    "https://i.imgur.com/qhAqK7e.png",
    "https://i.imgur.com/cNpWi4g.png",
    "https://i.imgur.com/07VjZa7.png",
];


// --- CARD DEPOIMENTO PREMIUM ---
const TestimonialCard = ({ image, name, text }: { image: string, name: string, text: string }) => {
    return (
        <figure
            className="relative w-[320px] md:w-[380px] shrink-0 rounded-2xl border border-white/5 bg-[#121212]/80 p-5 backdrop-blur-md transition-all duration-300 hover:border-purple-500/40 hover:bg-white/5 hover:-translate-y-1 group"
        >
            {/* Aspas Decorativas no fundo */}
            <div className="absolute top-3 right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Quote size={48} className="text-white fill-white rotate-180" />
            </div>

            {/* Cabeçalho: Foto + Nome + Stars */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-purple-500 transition-all duration-500">
                    <Image 
                        src={image} 
                        alt={name} 
                        fill 
                        className="object-cover" 
                        sizes="48px"
                        quality={80}
                    />
                </div>
                <div>
                    <p className="font-bold text-sm md:text-base text-white group-hover:text-purple-300 transition-colors">{name}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Texto do Depoimento */}
            <blockquote className="text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-200 transition-colors">
                "{text}"
            </blockquote>

            {/* Ícone de Like sutil (detalhe de UI social) */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                <Heart size={16} className="text-purple-500 fill-purple-500" />
            </div>
        </figure>
    );
};

// --- MARQUEE INFINITO OTIMIZADO (GPU ACCELERATED) ---
const Marquee = ({ items, direction = "left", speed }: { items: { name: string, text: string, image: string }[], direction?: "left" | "right", speed: number }) => {
    return (
        <div className="w-full overflow-hidden flex select-none pointer-events-none">
            {/* Layer de Composição para Performance */}
            <motion.div
                className="flex gap-5 py-4 pr-5 will-change-transform" 
                initial={{ x: direction === "left" ? "0%" : "-50%" }}
                animate={{ x: direction === "left" ? "-50%" : "0%" }}
                transition={{ 
                    duration: speed, 
                    repeat: Infinity, 
                    ease: "linear",
                    repeatType: "loop"
                }}
                style={{ width: "max-content" }} // Garante que o container tenha o tamanho exato do conteúdo
            >
                {/* Duplicamos os itens 2x para garantir o loop em telas ultra-wide sem buracos */}
                {[...items, ...items].map((review, i) => (
                    <div key={`${direction}-${i}`} className="pointer-events-auto">
                         <TestimonialCard {...review} />
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default function TestimonialsMarquee() {
    const { t } = useTranslation();

    const testimonials = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
        name: t(`testimonials.t${i + 1}.name` as any),
        text: t(`testimonials.t${i + 1}.text` as any),
        image: testimonialImages[i],
    })), [t]);

    const topRow = testimonials.slice(0, 10);
    const bottomRow = testimonials.slice(10, 20);

    return (
        <div className="relative flex w-full flex-col items-center justify-center gap-4 py-8 overflow-hidden">
            {/* Linha Superior (Esquerda) - Mais lenta */}
            <Marquee items={topRow} direction="left" speed={80} />
            
            {/* Linha Inferior (Direita) - Um pouco mais rápida para dinamismo */}
            <Marquee items={bottomRow} direction="right" speed={70} />
        </div>
    );
}
