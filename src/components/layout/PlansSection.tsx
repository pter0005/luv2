"use client";
import Link from 'next/link';
import { Star, TestTube, Hourglass, DatabaseZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanFeature } from '@/components/layout/PlanFeature';
import { memo } from 'react';

const PlansSection = () => {
    return (
        <div className="container max-w-5xl relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Escolha seu plano para testar</h2>
                <p className="mt-4 text-base text-muted-foreground">Temos a opção ideal para eternizar seu momento, com a flexibilidade que você precisa.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="card-glow border-primary/50 p-8 rounded-2xl relative flex flex-col bg-white/5 backdrop-blur-md">
                    <div className="absolute -top-4 right-8 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <Star className="w-4 h-4" /> RECOMENDADO
                    </div>
                    <h3 className="text-2xl font-bold text-primary">Plano Avançado</h3>
                    <p className="text-muted-foreground text-sm mb-4">Todos os recursos liberados para a melhor experiência.</p>
                    <div className="text-center my-6 space-y-1">
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-2xl font-medium text-muted-foreground line-through">De R$59,90</span>
                            <span className="text-4xl font-bold text-foreground">por R$14,90</span>
                        </div>
                        <p className="text-sm text-primary font-bold animate-pulse">(Só hoje!)</p>
                        <p className="text-xs text-muted-foreground">Pagamento único</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text='Galeria de fotos (até 6)' />
                        <PlanFeature text='Música de fundo' />
                        <PlanFeature text='Quebra-cabeça Interativo' />
                        <PlanFeature text='Linha do Tempo 3D (até 20 momentos)' />
                        <PlanFeature text='Página permanente com backup infinito' icon={DatabaseZap} />
                    </ul>
                    <Button asChild size="lg" className="w-full mt-auto">
                        <Link href="/login?redirect=/criar?plan=avancado&new=true"><TestTube className="mr-2" />Testar Plano Avançado</Link>
                    </Button>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-border p-8 rounded-2xl flex flex-col">
                    <h3 className="text-2xl font-bold">Plano Econômico</h3>
                    <p className="text-muted-foreground text-sm mb-4">Ideal para uma surpresa mais direta e emocionante.</p>
                    <div className="text-center my-6">
                        <p className="text-4xl font-bold text-foreground">R$9,90</p>
                        <p className="text-sm text-muted-foreground">Pagamento único</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <PlanFeature text='Galeria de fotos (até 2)' />
                         <PlanFeature text='Linha do Tempo 3D (até 5 momentos)' />
                        <PlanFeature text='Página disponível por 24h' icon={Hourglass} />
                        <PlanFeature text='Música de fundo' included={false} />
                        <PlanFeature text='Quebra-cabeça Interativo' included={false}/>
                    </ul>
                     <Button asChild size="lg" className="w-full mt-auto" variant="secondary">
                        <Link href="/login?redirect=/criar?plan=basico&new=true"><TestTube className="mr-2" />Testar Plano Econômico</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default memo(PlansSection);
