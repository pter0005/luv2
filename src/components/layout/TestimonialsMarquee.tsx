"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

// --- DADOS DOS DEPOIMENTOS (20 Casais) ---
const testimonials = [
    // --- LINHA DE CIMA (10 Casais) ---
    { name: "Lucas & Mariana", text: "A melhor surpresa de aniversário que já fiz! Ela chorou de alegria quando viu nossa linha do tempo.", image: "https://images.unsplash.com/photo-1621624666561-84d00bae58f6?w=150&h=150&fit=crop&crop=faces" },
    { name: "Thiago & Beatriz", text: "Simplesmente mágico. A linha do tempo 3D é o ponto alto, ficamos horas revendo nossas fotos.", image: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=150&h=150&fit=crop&crop=faces" },
    { name: "Rafael & Júlia", text: "O quebra-cabeça no início foi genial! Deixou tudo mais emocionante antes da revelação.", image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=faces" },
    { name: "Gustavo & Laura", text: "Plataforma super fácil de usar e o resultado final é de cinema. Recomendo 100% para quem quer impressionar.", image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=faces" },
    { name: "Matheus & Isabela", text: "Fiz para nosso aniversário de namoro. A reação dela não teve preço, foi um momento único.", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces" },
    { name: "Bruno & Manuela", text: "A qualidade dos efeitos de fundo e a música criaram um clima perfeito. Muito profissional.", image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=faces" },
    { name: "Felipe & Giovanna", text: "Serviço impecável. O QR Code chegou na hora e funcionou perfeitamente no jantar.", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces" },
    { name: "Daniel & Alice", text: "Muito mais criativo que um presente comum. É uma memória digital que fica para sempre.", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces" },
    { name: "Eduardo & Sophia", text: "Ver nossa história contada daquele jeito foi emocionante demais. Lindo trabalho.", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=faces" },
    { name: "Vinicius & Valentina", text: "O suporte foi super atencioso quando tive uma dúvida. Atendimento nota 10.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces" },
    
    // --- LINHA DE BAIXO (10 Casais) ---
    { name: "André & Helena", text: "Achei que seria complicado, mas foi super intuitivo. O resultado ficou incrível em minutos!", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces" },
    { name: "Leonardo & Luiza", text: "Minha namorada ficou sem palavras. É o tipo de presente que marca a relação para sempre.", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces" },
    { name: "Rodrigo & Lívia", text: "A galeria de fotos com efeito 3D é um show à parte. Adoramos cada detalhe.", image: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=150&h=150&fit=crop&crop=faces" },
    { name: "Gabriel & Clara", text: "Fiz para o Dia dos Namorados e foi um sucesso absoluto. Muito original e romântico.", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces" },
    { name: "Alexandre & Gabriela", text: "Cada detalhe é pensado com carinho. Valeu cada centavo investido nessa surpresa.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces" },
    { name: "Diego & Yasmin", text: "A animação dos corações caindo é um toque simples, mas que faz toda a diferença.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces" },
    { name: "Ricardo & Letícia", text: "A ferramenta de IA para escrever a mensagem me salvou! Faltava inspiração e ficou lindo.", image: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&h=150&fit=crop&crop=faces" },
    { name: "Sérgio & Nicole", text: "Moderno, romântico e tecnológico. O presente perfeito para os dias de hoje.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces" },
    { name: "Fernando & Sarah", text: "Finalmente algo diferente para presentear. Surpreendeu de verdade pela qualidade.", image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=faces" },
    { name: "William & Carolina", text: "O contador de tempo é um detalhe que amamos. Ficamos olhando os segundos passarem juntos.", image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=faces" },
];

const topRow = testimonials.slice(0, 10);
const bottomRow = testimonials.slice(10, 20);

// --- COMPONENTE DO CARD ---
const TestimonialCard = ({ image, name, text }: { image: string, name: string, text: string }) => {
    return (
        <figure
            className="relative w-[350px] md:w-[400px] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-purple-500/30 hover:bg-white/10 group"
        >
            {/* Ícone de Citação Decorativo */}
            <div className="absolute top-4 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={40} className="text-purple-400 fill-purple-400 rotate-180" />
            </div>

            <div className="flex items-center gap-4 mb-5">
                <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden ring-2 ring-purple-500/20 group-hover:ring-purple-500/50 transition-all">
                    <Image 
                        src={image} 
                        alt={name} 
                        fill 
                        className="object-cover" 
                        sizes="56px"
                    />
                </div>
                <div>
                    <p className="font-bold text-base text-white group-hover:text-purple-200 transition-colors">{name}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 drop-shadow-sm" />
                        ))}
                    </div>
                </div>
            </div>
            <blockquote className="text-sm leading-relaxed text-gray-300 group-hover:text-gray-100 transition-colors">
                "{text}"
            </blockquote>
        </figure>
    );
};

// --- COMPONENTE MARQUEE (A MÁGICA ACONTECE AQUI) ---
const Marquee = ({ items, direction = "left", speed = 50 }: { items: typeof topRow, direction?: "left" | "right", speed?: number }) => {
    return (
        <div className="w-full overflow-hidden flex select-none">
            <motion.div
                className="flex gap-6 py-4 pr-6" // pr-6 para espaço entre o último e o primeiro do loop
                initial={{ x: direction === "left" ? "0%" : "-50%" }}
                animate={{ x: direction === "left" ? "-50%" : "0%" }}
                transition={{ 
                    duration: speed, 
                    repeat: Infinity, 
                    ease: "linear",
                    repeatType: "loop"
                }}
                style={{ width: "fit-content" }}
            >
                {/* Renderizamos a lista DUAS vezes para criar o loop perfeito */}
                {items.map((review, i) => (
                    <TestimonialCard key={`original-${i}`} {...review} />
                ))}
                {items.map((review, i) => (
                    <TestimonialCard key={`clone-${i}`} {...review} />
                ))}
            </motion.div>
        </div>
    );
};

export default function TestimonialsMarquee() {
    return (
        <div className="relative flex w-full flex-col items-center justify-center gap-6 py-8 overflow-hidden">
            {/* Gradientes Laterais para Suavizar a Entrada/Saída */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10"></div>

            {/* Linha Superior (Esquerda) */}
            <Marquee items={topRow} direction="left" speed={60} />
            
            {/* Linha Inferior (Direita) */}
            <Marquee items={bottomRow} direction="right" speed={70} />
        </div>
    );
}