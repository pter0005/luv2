"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star, Quote, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

// --- DADOS REAIS & HUMANIZADOS (Gírias + Linguagem Jovem) ---
const testimonials = [
    // --- LINHA DE CIMA ---
    { name: "Lucas & Mari", text: "Mano, na moral... ela chorou horrores qnd viu kkkk. Ficou mto perfeito, sério!", image: "https://images.unsplash.com/photo-1568414269584-5c4a03502936?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Bia & Thiago", text: "Gente, o q é essa linha do tempo?? A gente ficou um tempão lembrando dos roles. Surreal.", image: "https://images.unsplash.com/photo-1554188248-986adbb73371?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Rafa & Ju", text: "Eu sou zero criativo pra presente, mas isso aqui salvou dms. Montei em 20 min e ficou top.", image: "https://images.unsplash.com/photo-1594419542038-a12a22579737?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Gui & Lau", text: "O puzzle no começo é genial, ela ficou tipo 'uai oq é isso?' e dps amou a surpresa.", image: "https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Matheus & Isa", text: "Melhor presente, papo reto. Mto melhor que dar só chocolate ou roupa. Ela postou em tudo q é lugar.", image: "https://images.unsplash.com/photo-1549419137-535d909b0222?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Bru & Manu", text: "Achei q ia ser difícil de fazer mas é mó de boa. A musica de fundo deu mó clima 😍", image: "https://images.unsplash.com/photo-1515810231945-885731773489?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Fe & Gi", text: "O QR Code funcionou direitinho no jantar. Foi o ponto alto da noite, vlw msm!", image: "https://images.unsplash.com/photo-1567457490308-72644a95780f?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Dani & Lice", text: "Cara, mt foda. É uma parada q fica pra sempre, tlgd? Não é q nem presente q acaba ou quebra.", image: "https://images.unsplash.com/photo-1567520668032-23c896d7c485?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Du & Sophia", text: "Nossa história ficou linda demais ali. Chorei junto com ela, admito kkkk.", image: "https://images.unsplash.com/photo-1587403913054-c817291a2e7c?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Vini & Valen", text: "O suporte me ajudou rapidão com a foto q tava torta. Atendimento 10/10.", image: "https://images.unsplash.com/photo-1558238459-25f0dba49f39?w=150&h=150&fit=crop&crop=faces&q=80" },
    
    // --- LINHA DE BAIXO ---
    { name: "Dedé & Lena", text: "Sem palavras... ficou mto profissa! Parece q paguei uma fortuna pra um designer fazer.", image: "https://images.unsplash.com/photo-1559526324-c1f275fbfa32?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Léo & Lu", text: "Minha mina ficou chocada. Falou q foi o presente mais criativo q eu já dei. Vcs são brabos!", image: "https://images.unsplash.com/photo-1574284883300-d867a3039304?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Rô & Liv", text: "As fotos em 3D dão um tchan a mais. Ficamos vendo no celular um tempão.", image: "https://images.unsplash.com/photo-1515940023024-2782c5f115a7?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Gabs & Clara", text: "Fiz pro dia dos namorados, foi sucesso total. Todo mundo perguntou como eu fiz kkk.", image: "https://images.unsplash.com/photo-1529552554749-886470b16a24?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Ale & Gabi", text: "Vale cada centavo, na moral. É mto barato pelo tanto q emociona.", image: "https://images.unsplash.com/photo-1508215904-a6988825b733?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Di & Yas", text: "Os coraçõezinhos caindo na tela... aff q amor! ❤️ Ela amou demais.", image: "https://images.unsplash.com/photo-1553921355-c05345d131a9?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Rick & Lê", text: "Usei a IA pra escrever o texto pq sou péssimo com palavras e ficou lindo dms.", image: "https://images.unsplash.com/photo-1525114734253-e9a7e1f42289?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Serginho & Nick", text: "Simples, rápido e emocionante. O combo perfeito pra quem quer surpreender.", image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Fer & Sah", text: "Eu tava sem ideia do q dar e isso salvou meu namoro kkkk brincadeira, mas ajudou mto!", image: "https://images.unsplash.com/photo-1533244243430-58005eb55c3c?w=150&h=150&fit=crop&crop=faces&q=80" },
    { name: "Will & Carol", text: "Aquele contador de tempo é hipnotizante. A gnt fica olhando os segundos passarem juntinhos.", image: "https://images.unsplash.com/photo-1506193700-159b1a4a49a9?w=150&h=150&fit=crop&crop=faces&q=80" },
];

const topRow = testimonials.slice(0, 10);
const bottomRow = testimonials.slice(10, 20);

// --- CARD DEPOIMENTO PREMIUM ---
const TestimonialCard = ({ image, name, text }: { image: string, name: string, text: string }) => {
    return (
        <figure
            className="relative w-[320px] md:w-[380px] shrink-0 rounded-2xl border border-white/5 bg-[#121212]/80 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-purple-500/40 hover:bg-white/5 hover:-translate-y-1 group"
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
const Marquee = ({ items, direction = "left", speed }: { items: typeof topRow, direction?: "left" | "right", speed: number }) => {
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
    return (
        <div className="relative flex w-full flex-col items-center justify-center gap-4 py-8 overflow-hidden mask-image-fade">
            
            {/* Efeito de Máscara Lateral (Fade Out) */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-black to-transparent z-20"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-black to-transparent z-20"></div>

            {/* Linha Superior (Esquerda) - Mais lenta */}
            <Marquee items={topRow} direction="left" speed={80} />
            
            {/* Linha Inferior (Direita) - Um pouco mais rápida para dinamismo */}
            <Marquee items={bottomRow} direction="right" speed={70} />
            
        </div>
    );
}
