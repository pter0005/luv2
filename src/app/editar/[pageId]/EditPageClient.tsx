'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Check, Loader2, AlertCircle, ExternalLink, Crown, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { pageSchema, chatDefaultValues, type PageData } from '@/lib/wizard-schema';
import { updateLovePage } from '@/app/criar/fazer-eu-mesmo/actions';
import { useToast } from '@/hooks/use-toast';

import TitleField from '@/components/chat/fields/TitleField';
import MessageField from '@/components/chat/fields/MessageField';
import RecipientNameField from '@/components/chat/fields/RecipientNameField';
import DateField from '@/components/chat/fields/DateField';
import GalleryField from '@/components/chat/fields/GalleryField';
import TimelineField from '@/components/chat/fields/TimelineField';
import MusicField from '@/components/chat/fields/MusicField';
import BackgroundField from '@/components/chat/fields/BackgroundField';
import IntroField from '@/components/chat/fields/IntroField';
import VoiceField from '@/components/chat/fields/VoiceField';
import ExtrasField from '@/components/chat/fields/ExtrasField';

interface EditPageClientProps {
  pageId: string;
  ownerId: string;
  initialData: any;
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

export default function EditPageClient({ pageId, ownerId, initialData }: EditPageClientProps) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(SECTIONS.filter(s => s.defaultOpen).map(s => s.id)));
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Hydrate form com dados da página. Merge com defaults pra cobrir campos
  // que podem estar faltando em páginas antigas (pré-schema atualizado).
  // Datas são revividas de ISO → Date antes do merge pra Zod validar certo.
  const defaultValues = useMemo(
    () => ({ ...chatDefaultValues, ...reviveDates(initialData) }) as PageData,
    [initialData],
  );

  const methods = useForm<PageData>({
    resolver: zodResolver(pageSchema),
    mode: 'onBlur',
    defaultValues,
    shouldUnregister: false,
  });

  // Auth gate no client: dono OU loading. Se user carregou e NÃO é dono, redirect.
  // Admin bypass não é checado no client — o server action já cobre.
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      // Sem login — manda pro login e volta depois
      router.replace(`/login?redirect=/editar/${pageId}`);
      return;
    }
    if (user.uid !== ownerId) {
      toast({ variant: 'destructive', title: 'Sem permissão', description: 'Você não é o dono desta página.' });
      router.replace(`/p/${pageId}`);
      return;
    }
    setAuthChecked(true);
  }, [user, isUserLoading, ownerId, pageId, router, toast]);

  const toggleSection = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!user) return;
    methods.handleSubmit(
      (data) => {
        startSaving(async () => {
          // Tira campos que o backend bloqueia (defense in depth — o server
          // também strippa, mas poupamos bandwidth e evitamos sanitize server-side).
          const payload: any = { ...data };
          delete payload.plan;
          delete payload.userId;
          delete payload.intentId;
          delete payload.payment; // PII sensível — não envolvida no edit
          delete payload.utmSource;
          delete payload.whatsappNumber; // já salvo no create, edit não mexe

          const res = await updateLovePage(pageId, user.uid, payload);
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
        toast({ variant: 'destructive', title: 'Campos inválidos', description: 'Revise os campos destacados.' });
      },
    )();
  };

  if (isUserLoading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60">
        <Loader2 className="w-8 h-8 animate-spin" />
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
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                      >
                        <div className="px-5 pb-5 pt-1">
                          <Comp />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
