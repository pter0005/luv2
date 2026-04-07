'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, Send, Loader2, CheckCircle, AlertTriangle, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PRESET_MESSAGES = [
  {
    id: 'reminder',
    label: 'Lembrete de presente',
    title: 'Nao esqueca de presentear quem voce ama 💜',
    body: 'Crie uma surpresa personalizada com fotos, musica e mensagem — pronto em 5 minutos!',
    url: 'https://mycupid.com.br/criar',
  },
  {
    id: 'promo',
    label: 'Promocao',
    title: 'Oferta especial no MyCupid! 🎉',
    body: 'Crie sua pagina de amor com desconto por tempo limitado. Nao perca!',
    url: 'https://mycupid.com.br/criar',
  },
  {
    id: 'abandon',
    label: 'Carrinho abandonado',
    title: 'Sua surpresa ta quase pronta! 💝',
    body: 'Voce comecou a criar algo especial. Volte e finalize em menos de 5 minutos!',
    url: 'https://mycupid.com.br/criar',
  },
  {
    id: 'review',
    label: 'Pedir avaliacao',
    title: 'Como foi a surpresa? ⭐',
    body: 'Conte pra gente como foi a reacao! Poste nos stories e ganhe um desconto especial.',
    url: 'https://mycupid.com.br',
  },
];

interface Props {
  total: number;
  active: number;
}

export default function NotificacoesClient({ total, active }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('https://mycupid.com.br/criar');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const handlePreset = (preset: typeof PRESET_MESSAGES[0]) => {
    setTitle(preset.title);
    setBody(preset.body);
    setUrl(preset.url);
    setResult(null);
    setError('');
  };

  const handleSend = async () => {
    if (!title || !body) {
      setError('Preencha titulo e mensagem');
      return;
    }

    setSending(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ sent: data.sent, failed: data.failed, total: data.total });
      } else {
        setError(data.error || 'Erro ao enviar');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexao');
    } finally {
      setSending(false);
    }
  };

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
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-black text-white">Push Notifications</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-6 max-w-3xl">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Users className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-3xl font-black text-white">{active}</p>
            <p className="text-xs text-zinc-500">Inscritos ativos</p>
          </div>
          <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Bell className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <p className="text-3xl font-black text-white">{total}</p>
            <p className="text-xs text-zinc-500">Total de inscricoes</p>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Mensagens prontas</p>
          <div className="flex gap-2 flex-wrap">
            {PRESET_MESSAGES.map(p => (
              <button key={p.id} onClick={() => handlePreset(p)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compose */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Titulo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo da notificacao..."
              className="w-full mt-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Corpo da notificacao..."
              rows={3}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">URL (ao clicar)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Preview */}
          {title && body && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p className="text-xs text-purple-400 font-bold mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Preview</p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{body}</p>
                </div>
              </div>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !title || !body}
            className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
              boxShadow: '0 0 30px rgba(147,51,234,0.3)',
            }}
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enviando para {active} inscritos...</>
            ) : (
              <><Send className="w-4 h-4" /> Enviar para {active} inscritos</>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-300">Enviado com sucesso!</p>
                <p className="text-xs text-zinc-400">{result.sent} entregues · {result.failed} falharam · {result.total} total</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Como funciona</p>
          <ul className="space-y-2 text-xs text-zinc-500">
            <li>1. Visitantes do site recebem um popup pedindo permissao de notificacao</li>
            <li>2. Quem aceitar fica salvo como inscrito</li>
            <li>3. Voce envia notificacoes daqui para todos os inscritos</li>
            <li>4. A notificacao aparece no celular/desktop mesmo com o site fechado</li>
            <li>5. Inscricoes invalidas sao removidas automaticamente</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
