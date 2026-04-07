'use client';

import { ShieldCheck, Lock, Headphones } from 'lucide-react';

interface GuaranteeBadgeProps {
    compact?: boolean;
}

export default function GuaranteeBadge({ compact = false }: GuaranteeBadgeProps) {
    if (compact) {
        return (
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Garantia 7 dias
                </span>
                <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    Dados protegidos
                </span>
                <span className="flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-blue-400" />
                    Suporte 24h
                </span>
            </div>
        );
    }

    return (
        <div
            className="rounded-2xl p-5 text-center"
            style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(15,10,30,0.5) 100%)',
                border: '1px solid rgba(34,197,94,0.15)',
            }}
        >
            <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-black text-white">Garantia de 7 dias</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Se voce nao ficar satisfeito, devolvemos 100% do valor. Sem perguntas.
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-400" /> Pagamento Seguro
                </span>
                <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Dados Protegidos
                </span>
                <span className="flex items-center gap-1">
                    <Headphones className="w-3 h-3 text-blue-400" /> Suporte 24h
                </span>
            </div>
        </div>
    );
}
