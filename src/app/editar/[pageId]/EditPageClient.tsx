'use client';

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Check, Loader2, AlertCircle, ExternalLink, Crown, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { pageSchema, pageEditSchema, chatDefaultValues, type PageData } from '@/lib/wizard-schema';
import { updateLovePage } from '@/app/criar/fazer-eu-mesmo/actions';
import { requestEditAccess } from './auth';
import { useToast } from '@/hooks/use-toast';

// Fields leves (texto simples) carregam direto. Fields pesados (galeria,
// timeline, jogos, música) carregam SÓ quando o user abre a seção — evita
// montar 11 forms simultâneos no mount, que travava a página.
import TitleField from '@/components/chat/fields/TitleField';
import MessageField from '@/components/chat/fields/MessageField';
import RecipientNameField from '@/components/chat/fields/RecipientNameField';
import DateField from '@/components/chat/fields/DateField';
import IntroField from '@/components/chat/fields/IntroField';
import BackgroundField from '@/components/chat/fields/BackgroundField';

// Skeleton enquanto carrega (sem layout shift)
const FieldSkeleton = () => (
  <div className="space-y-2 animate-pulse">
    <div className="h-10 rounded-lg bg-white/5" />
    <div className="h-24 rounded-lg bg-white/5" />
  </div>
);

const GalleryField = dynamic(() => import('@/components/chat/fields/GalleryField'), { ssr: false, loading: () => <FieldSkeleton /> });
const TimelineField = dynamic(() => import('@/components/chat/fields/TimelineField'), { ssr: false, loading: () => <FieldSkeleton /> });
const MusicField = dynamic(() => import('@/components/chat/fields/MusicField'), { ssr: false, loading: () => <FieldSkeleton /> });
const VoiceField = dynamic(() => import('@/components/chat/fields/VoiceField'), { ssr: false, loading: () => <FieldSkeleton /> });
const ExtrasField = dynamic(() => import('@/components/chat/fields/ExtrasField'), { ssr: false, loading: () => <FieldSkeleton /> });

interface EditPageClientProps {
  pageId: string;
  ownerId: string;
  initialData: any;
  /** Email mascarado ("pedr***@gmail.com") pra mostrar como dica no modal de verificação */
  pageEmailHint?: string;
  /** Se true, o servidor já validou que tem cookie de edição válido — pula o modal */
  preAuthorized?: boolean;
}

interface Section {
  id: string;
  title: string;
  subtitle?: string;
  Component: React.ComponentType<any>;
  defaultOpen?: boolean;
}

const SECTIONS: Section[] = [
  { id: 'title',      title: 'Título',            subtitle: 'O nome da sua página',                    Component: TitleField, defaultOpen: true },
  { id: 'message',    title: 'Mensagem',          subtitle: 'Sua declaração',                           Component: MessageField },
  { id: 'recipient',  title: 'Nome da pessoa',    subtitle: 'Pra quem é a página',                      Component: RecipientNameField },
  { id: 'date',       title: 'Data especial',     subtitle: 'Início do relacionamento / aniversário',   Component: DateField },
  { id: 'gallery',    title: 'Galeria de fotos',  subtitle: 'Até 10 fotos',                             Component: GalleryField },
  { id: 'timeline',   title: 'Linha do tempo',    subtitle: 'Momentos marcantes',                       Component: TimelineField },
  { id: 'music',      title: 'Música',            subtitle: 'Trilha sonora da página',                  Component: MusicField },
  { id: 'voice',      title: 'Mensagem de voz',   subtitle: 'Grave uma mensagem',                       Component: VoiceField },
  { id: 'intro',      title: 'Abertura',          subtitle: 'Animação inicial',                         Component: IntroField },
  { id: 'background', title: 'Fundo',             subtitle: 'Cor do coração / animação',                Component: BackgroundField },
  { id: 'extras',     title: 'Jogos',             subtitle: 'Puzzle, memória, quiz, palavras',          Component: ExtrasField },
];

// Converte strings ISO de volta pra Date (o server serializou com toISOString).
// O schema espera z.date() em specialDate e timelineEvents[].date.
function reviveDates(data: any): any {
  if (!data || typeof data !== 'object') return data;
  const cloned: any = { ...data };
  if (typeof cloned.specialDate === 'string') {
    const d = new Date(cloned.specialDate);
    if (!isNaN(d.getTime())) cloned.specialDate = d;
  }
  if (Array.isArray(cloned.timelineEvents)) {
    cloned.timelineEvents = cloned.timelineEvents.map((ev: any) => {
      if (ev && typeof ev.date === 'string') {
        const d = new Date(ev.date);
        if (!isNaN(d.getTime())) return { ...ev, date: d };
      }
      return ev;
    });
  }
  return cloned;
}

export default function EditPageClient({ pageId, ownerId, initialData, pageEmailHint, preAuthorized }: EditPageClientProps) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(SECTIONS.filter(s => s.defaultOpen).map(s => s.id)));
  // mountedIds: seções que JÁ FORAM ABERTAS pelo menos uma vez. Continuam
  // montadas mesmo depois de fechar — preserva estado do RHF e evita
  // re-fetch ao reabrir. Render inicial fica leve (só defaultOpen monta).
  const mountedIdsRef = useRef<Set<string>>(new Set(SECTIONS.filter(s => s.defaultOpen).map(s => s.id)));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Hydrate form com dados da página. Merge com defaults pra cobrir campos
  // que podem estar faltando em páginas antigas (pré-schema atualizado).
  // Datas são revividas de ISO → Date antes do merge pra Zod validar certo.
  const defaultValues = useMemo(
    () => ({ ...chatDefaultValues, ...reviveDates(initialData) }) as PageData,
    [initialData],
  );

  const methods = useForm<PageData>({
    // Edição usa schema permissivo — páginas antigas podem ter campos com
    // formatos que não passariam na validação strict de criação (URLs estranhas,
    // mensagem vazia, quiz com opções em branco). User editando uma foto não
    // deve ser bloqueado por isso.
    resolver: zodResolver(pageEditSchema as any),
    mode: 'onBlur',
    defaultValues,
    shouldUnregister: false,
  });

  // ── AUTH: dois caminhos ──────────────────────────────────────────────────
  //  1. User logado que é o dono (user.uid === ownerId) — libera direto
  //  2. Cookie de edição já validado (`preAuthorized`) — libera direto
  //  3. Caso contrário → modal pedindo email. Se email bate com guestEmail da
  //     página, backend grava cookie e libera.
  const [authChecked, setAuthChecked] = useState(preAuthorized || false);
  const [emailModalOpen, setEmailModalOpen] = useState(!preAuthorized);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Se user logado bate com ownerId, libera silenciosamente (modal fecha)
  useEffect(() => {
    if (preAuthorized) return;
    if (isUserLoading) return;
    if (user && user.uid === ownerId) {
      setAuthChecked(true);
      setEmailModalOpen(false);
    }
  }, [user, isUserLoading, ownerId, preAuthorized]);

  const verifyEmail = async () => {
    setEmailError('');
    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setEmailError('Email inválido.');
      return;
    }
    setVerifying(true);
    try {
      const res = await requestEditAccess(pageId, email);
      if (res.ok) {
        setAuthChecked(true);
        setEmailModalOpen(false);
      } else {
        setEmailError(res.error || 'Não foi possível verificar.');
      }
    } catch {
      setEmailError('Erro. Tente de novo.');
    } finally {
      setVerifying(false);
    }
  };

  const toggleSection = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        // Marca como já montado pra evitar desmontar depois
        mountedIdsRef.current.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    // User logado passa o uid; user autenticado por email passa string vazia
    // (o backend valida via cookie edit_token_{pageId}).
    const callerUid = user?.uid || '';
    methods.handleSubmit(
      (data) => {
        startSaving(async () => {
          const payload: any = { ...data };
          delete payload.plan;
          delete payload.userId;
          delete payload.intentId;
          delete payload.payment;
          delete payload.utmSource;
          delete payload.whatsappNumber;

          const res = await updateLovePage(pageId, callerUid, payload);
          if (!res.success) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: res.error || 'Tente de novo.' });
            return;
          }
          setSavedAt(Date.now());
          toast({ title: 'Salvo ✨', description: 'Sua página foi atualizada.' });
        });
      },
      (errors) => {
        console.warn('[edit] form invalid', errors);
        // Mostra QUAL campo falhou — antes era "Revise os campos destacados"
        // genérico que deixava user sem saber o que fazer.
        const flat: string[] = [];
        const walk = (obj: any, prefix = '') => {
          if (!obj || typeof obj !== 'object') return;
          for (const k in obj) {
            const v = obj[k];
            if (v?.message) flat.push(`${prefix}${k}: ${v.message}`);
            else if (typeof v === 'object') walk(v, `${prefix}${k}.`);
          }
        };
        walk(errors);
        const detail = flat.slice(0, 3).join(' | ') || 'erro desconhecido';
        toast({
          variant: 'destructive',
          title: 'Não foi possível salvar',
          description: detail,
        });
        // Log defensivo pro admin investigar
        try {
          import('@/lib/wizard-stuck').then(m => m.reportWizardStuck({
            kind: 'next_blocked',
            step: 'edit',
            route: `/editar/${pageId}`,
            detail: flat.join(' | ').slice(0, 400),
            userId: user?.uid,
          }));
        } catch { /* silencioso */ }
      },
    )();
  };

  // Gate antes de mostrar o form: pede email se não está pre-autorizado nem é
  // o dono logado. UI estilo "enter your email" — o email salvo na compra é
  // a chave. Dica mascarada (pedr***@gmail.com) ajuda a lembrar sem vazar.
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#0a0012] via-[#060010] to-black text-white">
        <div className="w-full max-w-md rounded-2xl p-6 ring-1 ring-amber-400/30 bg-gradient-to-br from-amber-500/10 via-pink-500/5 to-purple-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 ring-1 ring-amber-300/40 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300/90 font-bold">Edição VIP</span>
              <h1 className="text-lg font-bold leading-tight">Verificar identidade</h1>
            </div>
          </div>

          <p className="text-sm text-white/60 mb-1 leading-relaxed">
            Pra editar, confirma o email usado na compra desta página:
          </p>
          {pageEmailHint && (
            <p className="text-[11px] text-amber-200/70 font-mono mb-4">
              Dica: <span className="text-amber-100">{pageEmailHint}</span>
            </p>
          )}
          {!pageEmailHint && <div className="mb-4" />}

          <div className="space-y-3">
            <div className="rounded-lg p-2.5 bg-amber-500/10 ring-1 ring-amber-400/20 text-[11.5px] text-amber-100/90 leading-relaxed">
              <strong className="text-amber-200">Atenção:</strong> o email precisa ser <strong>exatamente o mesmo</strong> que você usou ao comprar. Se não lembrar, confere na caixa de entrada — mandamos o link da página pra lá.
            </div>

            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="seuemail@exemplo.com"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') verifyEmail(); }}
              autoFocus
              disabled={verifying}
              className={cn(
                'w-full h-12 px-4 rounded-xl text-[15px] text-white placeholder:text-white/35',
                'bg-white/[0.04] ring-1 focus:bg-white/[0.06] focus:ring-2 focus:outline-none transition',
                emailError ? 'ring-red-400/50 focus:ring-red-400/60' : 'ring-white/10 focus:ring-amber-400/50',
              )}
            />

            {emailError && (
              <div className="flex items-start gap-2 rounded-lg p-2.5 bg-red-500/10 ring-1 ring-red-400/30">
                <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 shrink-0" />
                <span className="text-[12.5px] text-red-100/90">{emailError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={verifyEmail}
              disabled={verifying || !emailInput.trim()}
              className={cn(
                'w-full h-12 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 active:scale-[0.98]',
                'bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500',
                'shadow-[0_10px_30px_-10px_rgba(236,72,153,0.6)]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {verifying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
              ) : (
                <><Check className="w-4 h-4" /> Confirmar e editar</>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/p/${pageId}`)}
              className="w-full text-[12px] text-white/45 hover:text-white/70 transition"
            >
              Voltar pra página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0012] via-[#060010] to-black text-white pb-32">
      {/* Sticky header com botões */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/70 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/p/${pageId}`}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 flex items-center justify-center transition shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300/90 font-bold">VIP</span>
              </div>
              <h1 className="text-sm font-semibold truncate">Editar página</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/p/${pageId}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white px-3 h-9 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver página
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-4 h-9 rounded-lg font-bold text-sm transition active:scale-[0.97]',
                'bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 text-white',
                'shadow-[0_6px_20px_-6px_rgba(236,72,153,0.6)]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : savedAt && Date.now() - savedAt < 3000 ? (
                <><Check className="w-4 h-4" /> Salvo</>
              ) : (
                <><Save className="w-4 h-4" /> Salvar</>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        <FormProvider {...methods}>
          <div className="mb-6 rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 via-pink-500/5 to-purple-500/10 ring-1 ring-amber-400/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-400/20 ring-1 ring-amber-300/40 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-white mb-0.5">Benefício VIP — edite quando quiser</h2>
                <p className="text-[12.5px] text-white/60 leading-relaxed">
                  Mude fotos, mensagens, música, jogos e mais. As alterações aparecem na sua página em segundos.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {SECTIONS.map((sec) => {
              const open = openIds.has(sec.id);
              const Comp = sec.Component;
              return (
                <section
                  key={sec.id}
                  className={cn(
                    'rounded-2xl ring-1 transition-all overflow-hidden',
                    open
                      ? 'bg-white/[0.04] ring-white/15'
                      : 'bg-white/[0.02] ring-white/10 hover:ring-white/20',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold text-white">{sec.title}</div>
                      {sec.subtitle && (
                        <div className="text-[12px] text-white/50 mt-0.5">{sec.subtitle}</div>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-white/50 shrink-0 transition-transform',
                        open && 'rotate-180'
                      )}
                    />
                  </button>
                  {/* Render só depois que a seção foi aberta pelo menos uma vez.
                      Depois fica montado pra preservar estado do form. Toggle
                      visual é via CSS (display:none) — sem custo de remount. */}
                  {mountedIdsRef.current.has(sec.id) && (
                    <div className={cn('overflow-hidden transition-all', !open && 'hidden')}>
                      <div className="px-5 pb-5 pt-1">
                        <Comp />
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Bottom save button — redundante, pra quem descer até o fim da página */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                'w-full h-14 rounded-2xl font-bold text-white text-[15px] transition flex items-center justify-center gap-2 active:scale-[0.98]',
                'bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500',
                'shadow-[0_14px_40px_-12px_rgba(236,72,153,0.7)]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {isSaving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Salvando alterações...</>
              ) : (
                <><Save className="w-5 h-5" /> Salvar alterações</>
              )}
            </button>
            <Link
              href={`/p/${pageId}`}
              className="text-center text-[13px] text-white/50 hover:text-white/80 transition"
            >
              Voltar pra página sem salvar
            </Link>
          </div>
        </FormProvider>
      </main>
    </div>
  );
}
