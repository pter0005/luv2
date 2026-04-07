'use client';

import { useState } from 'react';
import { ArrowLeft, MessageCircle, ShoppingCart, Star, Send, Copy, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { type AbandonedCart, type RecentBuyer, markMessageSent } from './actions';

/* ── Message Templates ─────────────────────────────────────────────── */

const TEMPLATES = {
  recover: {
    label: 'Recuperar Carrinho',
    icon: '🛒',
    color: 'text-red-400',
    messages: [
      {
        id: 'recover-1',
        name: 'Lembrete gentil',
        text: 'Oi! 💜 Vi que voce comecou a criar uma surpresa no MyCupid mas nao terminou. A pessoa amada merece esse presente! Volte e finalize em menos de 5 minutos: https://mycupid.com.br/criar',
      },
      {
        id: 'recover-2',
        name: 'Urgencia + desconto',
        text: 'Oi! Seu rascunho de surpresa no MyCupid ainda ta salvo, mas pode expirar em breve ⏳ Volta la e finaliza — tem desconto especial esperando voce: https://mycupid.com.br/criar',
      },
      {
        id: 'recover-3',
        name: 'Emocional',
        text: 'Oi 💝 Voce tava criando algo lindo no MyCupid pra alguem especial. Nao deixa essa surpresa morrer! Termina em 5 minutinhos e faz o dia de alguem: https://mycupid.com.br/criar',
      },
    ],
  },
  review: {
    label: 'Pedir Avaliacao/Post',
    icon: '⭐',
    color: 'text-yellow-400',
    messages: [
      {
        id: 'review-1',
        name: 'Pedir review + desconto',
        text: 'Oi! 💜 Que bom que voce usou o MyCupid! A pessoa amada gostou da surpresa? Se voce postar o resultado nos stories e marcar @mycupid, ganha um desconto especial na proxima pagina! Manda o print pra gente 📸',
      },
      {
        id: 'review-2',
        name: 'Pedir depoimento',
        text: 'Oi! A surpresa que voce criou no MyCupid fez sucesso? 💝 Adoraria saber! Se quiser compartilhar como foi a reacao, posso te dar um credito gratis pra criar outra pagina. Conta pra gente!',
      },
      {
        id: 'review-3',
        name: 'Indicacao',
        text: 'Oi! 💜 Voce criou uma pagina incrivel no MyCupid! Sabia que se indicar pra um amigo, voce ganha uma pagina gratis? Manda esse link pra alguem: https://mycupid.com.br Quando a pessoa criar, seu credito e liberado automaticamente!',
      },
    ],
  },
  reminder: {
    label: 'Lembrete Geral',
    icon: '💌',
    color: 'text-purple-400',
    messages: [
      {
        id: 'reminder-1',
        name: 'Data especial',
        text: 'Oi! 💝 Ta chegando uma data especial e o MyCupid e a forma perfeita de surpreender quem voce ama. Crie uma pagina personalizada com fotos, musica e mensagem — pronto em 5 minutos! https://mycupid.com.br',
      },
      {
        id: 'reminder-2',
        name: 'Nao esqueca de presentear',
        text: 'Oi! Nao esqueca de presentear quem voce ama 💜 No MyCupid voce cria uma declaracao digital unica, com fotos, musica e ate quebra-cabeca interativo. A partir de R$19,90! https://mycupid.com.br',
      },
    ],
  },
};

type Tab = 'abandoned' | 'buyers' | 'templates';

interface Props {
  abandoned: AbandonedCart[];
  buyers: RecentBuyer[];
}

function formatPhone(digits: string): string {
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return digits;
}

function whatsappLink(phone: string, text: string): string {
  const clean = phone.replace(/\D/g, '');
  const intl = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://api.whatsapp.com/send?phone=${intl}&text=${encodeURIComponent(text)}`;
}

export default function WhatsAppClient({ abandoned, buyers }: Props) {
  const [tab, setTab] = useState<Tab>('abandoned');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES.recover.messages[0]);
  const [customText, setCustomText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const abandonedWithPhone = abandoned.filter(c => c.whatsappNumber);
  const abandonedWithoutPhone = abandoned.filter(c => !c.whatsappNumber);
  const buyersWithPhone = buyers.filter(b => b.whatsappNumber);

  const handleSend = async (phone: string, id: string, type: 'abandoned' | 'buyer', text: string) => {
    window.open(whatsappLink(phone, text), '_blank');
    setSentIds(prev => new Set(prev).add(id));
    await markMessageSent(id, type, selectedTemplate.id);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const messageText = customText || selectedTemplate.text;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#09090b' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(9,9,11,0.92)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">
          <Button asChild variant="ghost" size="sm" className="text-zinc-500 hover:text-white h-8 px-2">
            <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-black text-white">WhatsApp Marketing</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-6 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ShoppingCart className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">{abandoned.length}</p>
            <p className="text-xs text-zinc-500">Carrinhos abandonados</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <MessageCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">{abandonedWithPhone.length + buyersWithPhone.length}</p>
            <p className="text-xs text-zinc-500">Com WhatsApp</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Users className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">{buyers.length}</p>
            <p className="text-xs text-zinc-500">Compradores recentes</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { id: 'abandoned' as Tab, label: 'Carrinhos Abandonados', icon: ShoppingCart, count: abandoned.length },
            { id: 'buyers' as Tab, label: 'Compradores', icon: Star, count: buyers.length },
            { id: 'templates' as Tab, label: 'Templates', icon: MessageCircle, count: null },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== null && <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Template selector */}
        {tab !== 'templates' && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Mensagem selecionada</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                tmpl.messages.map(msg => (
                  <button key={msg.id} onClick={() => { setSelectedTemplate(msg); setCustomText(''); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedTemplate.id === msg.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}>
                    {tmpl.icon} {msg.name}
                  </button>
                ))
              ))}
            </div>
            <textarea
              value={customText || selectedTemplate.text}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Edite a mensagem acima ou selecione outro template</p>
          </div>
        )}

        {/* Abandoned carts tab */}
        {tab === 'abandoned' && (
          <div className="space-y-3">
            {abandonedWithPhone.length === 0 && abandonedWithoutPhone.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                <ShoppingCart className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="font-bold">Nenhum carrinho abandonado</p>
              </div>
            )}

            {abandonedWithPhone.length > 0 && (
              <>
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-3 h-3" /> Com WhatsApp ({abandonedWithPhone.length})
                </p>
                {abandonedWithPhone.map(cart => (
                  <div key={cart.intentId} className="rounded-2xl p-4 flex items-center gap-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-white truncate">{cart.title}</p>
                      <p className="text-xs text-zinc-500">{formatPhone(cart.whatsappNumber!)} · {cart.plan} · {cart.updatedAt}</p>
                      {cart.ownerEmail && <p className="text-xs text-zinc-600">{cart.ownerEmail}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sentIds.has(cart.intentId) && <CheckCircle className="w-4 h-4 text-green-400" />}
                      <button onClick={() => handleSend(cart.whatsappNumber!, cart.intentId, 'abandoned', messageText)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                        style={{ background: '#25D366' }}>
                        <Send className="w-3 h-3" /> Enviar
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {abandonedWithoutPhone.length > 0 && (
              <>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-6 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> Sem WhatsApp ({abandonedWithoutPhone.length})
                </p>
                {abandonedWithoutPhone.slice(0, 10).map(cart => (
                  <div key={cart.intentId} className="rounded-2xl p-4 opacity-50"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-sm font-bold text-white truncate">{cart.title}</p>
                    <p className="text-xs text-zinc-600">{cart.plan} · {cart.updatedAt} · {cart.ownerEmail || 'sem email'}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Buyers tab */}
        {tab === 'buyers' && (
          <div className="space-y-3">
            {buyers.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                <Star className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="font-bold">Nenhum comprador recente</p>
              </div>
            )}

            {buyersWithPhone.length > 0 && (
              <>
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-3 h-3" /> Com WhatsApp ({buyersWithPhone.length})
                </p>
                {buyersWithPhone.map(buyer => (
                  <div key={buyer.pageId} className="rounded-2xl p-4 flex items-center gap-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-white truncate">{buyer.title}</p>
                      <p className="text-xs text-zinc-500">{formatPhone(buyer.whatsappNumber!)} · {buyer.plan} · {buyer.createdAt}</p>
                      {buyer.ownerEmail && <p className="text-xs text-zinc-600">{buyer.ownerEmail}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sentIds.has(buyer.pageId) && <CheckCircle className="w-4 h-4 text-green-400" />}
                      <button onClick={() => handleSend(buyer.whatsappNumber!, buyer.pageId, 'buyer', messageText)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
                        style={{ background: '#25D366' }}>
                        <Send className="w-3 h-3" /> Enviar
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {buyers.filter(b => !b.whatsappNumber).length > 0 && (
              <>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-6 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> Sem WhatsApp
                </p>
                {buyers.filter(b => !b.whatsappNumber).slice(0, 10).map(buyer => (
                  <div key={buyer.pageId} className="rounded-2xl p-4 opacity-50"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-sm font-bold text-white truncate">{buyer.title}</p>
                    <p className="text-xs text-zinc-600">{buyer.plan} · {buyer.createdAt} · {buyer.ownerEmail || 'sem email'}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Templates tab */}
        {tab === 'templates' && (
          <div className="space-y-6">
            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
              <div key={key}>
                <p className={`text-sm font-bold ${tmpl.color} mb-3 flex items-center gap-2`}>
                  <span className="text-lg">{tmpl.icon}</span> {tmpl.label}
                </p>
                <div className="space-y-3">
                  {tmpl.messages.map(msg => (
                    <div key={msg.id} className="rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-white">{msg.name}</p>
                        <button onClick={() => handleCopy(msg.text, msg.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-500 hover:text-white transition-colors bg-white/5">
                          {copiedId === msg.id ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
