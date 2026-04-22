"use client";

import Image from 'next/image';
import { useMemo, memo } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLocale } from 'next-intl';

const HowItWorksSection = () => {
    const locale = useLocale();
    const isEN = locale === 'en';

    const simpleSteps = useMemo(() => isEN ? [
        { icon: PlaceHolderImages.find(p => p.id === 'step1')?.imageUrl, title: 'Tell your love story', description: 'Fill in the details of your relationship and pick unique elements to surprise the person you love.' },
        { icon: PlaceHolderImages.find(p => p.id === 'step2')?.imageUrl, title: 'Personalize every detail', description: 'Choose your photos, add your song and write a special message. This is where the magic happens!' },
        { icon: PlaceHolderImages.find(p => p.id === 'step3')?.imageUrl, title: 'Get your QR Code', description: 'As soon as you\'re done, you\'ll receive the QR Code to access the personalized gift in seconds.' },
        { icon: PlaceHolderImages.find(p => p.id === 'step4')?.imageUrl, title: 'Surprise with love', description: 'Share the QR Code and watch the emotion as they discover a gift that speaks straight to the heart.' },
    ] : [
        { icon: PlaceHolderImages.find(p => p.id === 'step1')?.imageUrl, title: 'Conte a sua história de amor', description: 'Preencha os dados do seu relacionamento e escolha elementos únicos para surpreender sua pessoa amada.' },
        { icon: PlaceHolderImages.find(p => p.id === 'step2')?.imageUrl, title: 'Personalize cada detalhe', description: 'Escolha suas fotos, adicione a música de vocês e escreva uma mensagem especial. É aqui que a mágica acontece!' },
        { icon: PlaceHolderImages.find(p => p.id === 'step3')?.imageUrl, title: 'Receba seu QR Code', description: 'Após a finalização, você receberá o QR Code de acesso ao presente personalizado em poucos instantes.' },
        { icon: PlaceHolderImages.find(p => p.id === 'step4')?.imageUrl, title: 'Surpreenda com amor', description: 'Compartilhe o QR Code e veja a emoção ao descobrir um presente que fala diretamente ao coração.' },
    ], [isEN]);

    return (
        <div className="container max-w-6xl relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-headline font-bold tracking-tighter text-4xl md:text-5xl">
                {isEN
                  ? <>Create an unforgettable gift in <span className="text-primary">4 simple steps</span></>
                  : <>Crie um presente inesquecível em <span className="text-primary">4 passos simples</span></>}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {simpleSteps.map((step, i) => (
                    <div key={i} className="relative flex flex-col items-center text-center group">
                        <div className="absolute -top-5 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30 z-10">
                            {i+1}
                        </div>
                        <div className="card-glow p-6 pt-10 rounded-2xl flex flex-col items-center flex-grow w-full transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-105 bg-white/5 border-white/10">
                            <div className="relative w-48 h-48 mb-4">
                                <Image src={step.icon || "https://placehold.co/160"} alt={step.title} fill className="object-contain" sizes="192px"/>
                            </div>
                            <h3 className="font-bold text-lg text-foreground">{step.title}</h3>
                            <p className="text-muted-foreground text-sm mt-2 flex-grow">{step.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(HowItWorksSection);
