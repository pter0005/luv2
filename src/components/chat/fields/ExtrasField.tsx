'use client';

import React, { useRef, useState } from 'react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Gamepad2,
  HelpCircle,
  Puzzle as PuzzleIcon,
  Wand2,
  Upload,
  Plus,
  X,
  Loader2,
  Check,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { uploadFile } from '@/lib/upload';
import { compressImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import type { PageData } from '@/lib/wizard-schema';
import { useLocale } from 'next-intl';

interface ExtraConfig {
  key: 'enablePuzzle' | 'enableMemoryGame' | 'enableQuiz' | 'enableWordGame';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  accent: string; // gradient classes
}

const EXTRAS_PT: ExtraConfig[] = [
  { key: 'enablePuzzle', icon: PuzzleIcon, label: 'Quebra-cabeça', desc: 'Monta peça por peça pra ver a foto', accent: 'from-pink-500 to-rose-500' },
  { key: 'enableMemoryGame', icon: Gamepad2, label: 'Jogo da memória', desc: 'Pares de fotos pra virar e combinar', accent: 'from-fuchsia-500 to-pink-500' },
  { key: 'enableQuiz', icon: HelpCircle, label: 'Quiz do casal', desc: 'Perguntas que só ele(a) sabe', accent: 'from-purple-500 to-pink-500' },
  { key: 'enableWordGame', icon: Wand2, label: 'Adivinhe a palavra', desc: 'Forca romântica — descobre a palavra', accent: 'from-violet-500 to-fuchsia-500' },
];
const EXTRAS_EN: ExtraConfig[] = [
  { key: 'enablePuzzle', icon: PuzzleIcon, label: 'Puzzle', desc: 'Solve piece by piece to reveal the photo', accent: 'from-pink-500 to-rose-500' },
  { key: 'enableMemoryGame', icon: Gamepad2, label: 'Memory match', desc: 'Flip cards and pair up your photos', accent: 'from-fuchsia-500 to-pink-500' },
  { key: 'enableQuiz', icon: HelpCircle, label: 'Couple\'s quiz', desc: 'Questions only they would know', accent: 'from-purple-500 to-pink-500' },
  { key: 'enableWordGame', icon: Wand2, label: 'Guess the word', desc: 'Romantic hangman — crack the word', accent: 'from-violet-500 to-fuchsia-500' },
];

// ───────────────────────────────────────────────────
// Helpers de UI
// ───────────────────────────────────────────────────
function SectionLabel({ children, n }: { children: React.ReactNode; n?: number }) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      {typeof n === 'number' && (
        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white text-[11px] font-bold flex items-center justify-center shadow ring-1 ring-white/20">
          {n}
        </span>
      )}
      <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60">{children}</span>
    </div>
  );
}

function TipCallout({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg px-3 py-2 bg-gradient-to-br from-pink-500/10 to-purple-500/5 ring-1 ring-pink-400/25 flex items-start gap-2">
      <span className="text-sm leading-none shrink-0 mt-0.5">{emoji}</span>
      <p className="text-[11.5px] text-pink-100/90 leading-relaxed">{children}</p>
    </div>
  );
}

// ───────────────────────────────────────────────────
// Sub-form: Puzzle
// ───────────────────────────────────────────────────
function PuzzleSubForm() {
  const { watch, setValue } = useFormContext<PageData>();
  const img = watch('puzzleImage');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const firebase = useFirebase();
  const { toast } = useToast();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let activeUser = user;
    if (!activeUser && firebase.auth) {
      const cred = await signInAnonymously(firebase.auth);
      activeUser = cred.user;
    }
    if (!activeUser) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1200, 0.85);
      const uploaded = await uploadFile(firebase.storage, activeUser.uid, compressed, 'puzzle');
      setValue('puzzleImage', uploaded, { shouldDirty: true, shouldTouch: true });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err?.message ?? 'Tente de novo' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <SectionLabel n={1}>foto do quebra-cabeça</SectionLabel>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
      {img?.url ? (
        <div className="flex items-center gap-3">
          <div className="relative aspect-square w-[88px] shrink-0 rounded-xl overflow-hidden ring-2 ring-pink-400/40 shadow-[0_8px_24px_-8px_rgba(236,72,153,0.5)]">
            <Image src={img.url} alt="" fill className="object-cover" sizes="88px" />
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-[12px] text-white/80 leading-snug">Perfeito! Essa foto vai virar um quebra-cabeça de 9 peças 🧩</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[11px] font-semibold text-pink-300 hover:text-pink-200 underline decoration-dotted underline-offset-2"
            >
              trocar foto
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 hover:from-pink-500/25 hover:to-purple-500/20 ring-2 ring-dashed ring-pink-400/30 hover:ring-pink-400/50 flex flex-col items-center justify-center gap-1.5 transition"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-pink-300" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-white">Escolher uma foto</span>
              <span className="text-[11px] text-white/50">vai virar um quebra-cabeça 9x9</span>
            </>
          )}
        </button>
      )}
      <TipCallout emoji="💡">
        Uma foto que <strong>só ele(a) vai entender</strong> funciona melhor — a primeira foto juntos, o lugar onde pediu em namoro…
      </TipCallout>
    </div>
  );
}

// ───────────────────────────────────────────────────
// Sub-form: Memory Game
// ───────────────────────────────────────────────────
function MemorySubForm() {
  const { watch, setValue } = useFormContext<PageData>();
  const imgs = watch('memoryGameImages') ?? [];
  const [pending, setPending] = useState<{ id: string; previewUrl: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const firebase = useFirebase();
  const { toast } = useToast();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 6 - imgs.length - pending.length;
    if (remaining <= 0) {
      toast({ variant: 'destructive', title: 'Limite de 6 fotos', description: 'Remove uma foto pra adicionar outra.' });
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    if (files.length > selected.length) {
      toast({ title: `${selected.length} de ${files.length} fotos`, description: 'Limite de 6 atingido — o resto foi ignorado.' });
    }

    let activeUser = user;
    if (!activeUser && firebase.auth) {
      const cred = await signInAnonymously(firebase.auth);
      activeUser = cred.user;
    }
    if (!activeUser) { if (fileRef.current) fileRef.current.value = ''; return; }

    // Previews instantâneos
    const batch = selected.map((file) => ({ id: crypto.randomUUID(), previewUrl: URL.createObjectURL(file) }));
    setPending((prev) => [...prev, ...batch]);

    // Sobe em paralelo mas salva no form em um único setValue por chunk — evita
    // race (cada upload paralelo liam o mesmo snapshot e sobrescreviam).
    let failed = 0;
    const results = await Promise.all(
      selected.map(async (file, idx) => {
        const entry = batch[idx];
        try {
          let toUpload: File | Blob = file;
          try {
            // Cartas do jogo da memória são bem pequenas no render — 900px sobra.
            toUpload = await compressImage(file, 900, 0.76);
          } catch (err) {
            console.warn('[memory] compressImage falhou, enviando original', err);
          }
          const up = await uploadFile(firebase.storage, activeUser!.uid, toUpload, 'memory');
          return { ok: true as const, up, entry };
        } catch (err) {
          console.error('[memory] upload falhou', err);
          return { ok: false as const, entry };
        }
      })
    );
    const successful = results.filter((r) => r.ok).map((r) => (r as any).up);
    failed = results.filter((r) => !r.ok).length;
    if (successful.length) {
      setValue(
        'memoryGameImages',
        [...(watch('memoryGameImages') ?? []), ...successful] as any,
        { shouldDirty: true, shouldTouch: true }
      );
    }
    setPending((prev) => {
      const settled = new Set(results.map((r) => r.entry.id));
      prev.forEach((p) => { if (settled.has(p.id)) URL.revokeObjectURL(p.previewUrl); });
      return prev.filter((p) => !settled.has(p.id));
    });

    if (failed > 0) {
      toast({ variant: 'destructive', title: `${failed} ${failed === 1 ? 'foto falhou' : 'fotos falharam'}`, description: 'Tenta de novo.' });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel n={1}>fotos pro jogo</SectionLabel>
        <span className={cn(
          'text-[10.5px] font-bold px-2 py-0.5 rounded-full',
          imgs.length < 3 ? 'bg-pink-500/20 text-pink-200 ring-1 ring-pink-400/30' : 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30'
        )}>
          {imgs.length}/6 {imgs.length < 3 && `(mín 3)`}
        </span>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />

      <div className="grid grid-cols-3 gap-2">
        {imgs.map((im: any, i: number) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden ring-2 ring-fuchsia-400/30 shadow-[0_6px_18px_-8px_rgba(217,70,239,0.4)]">
            <Image src={im.url} alt="" fill className="object-cover" sizes="100px" />
            <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</div>
            <button
              type="button"
              onClick={() => setValue('memoryGameImages', imgs.filter((_: any, idx: number) => idx !== i) as any, { shouldDirty: true, shouldTouch: true })}
              className="absolute top-1 right-1 bg-black/70 hover:bg-red-500/90 text-white rounded-full p-0.5 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden ring-2 ring-fuchsia-400/60">
            <img src={p.previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          </div>
        ))}
        {imgs.length + pending.length < 6 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending.length > 0}
            className="aspect-square rounded-xl bg-gradient-to-br from-fuchsia-500/10 to-pink-500/5 hover:from-fuchsia-500/15 hover:to-pink-500/10 ring-2 ring-dashed ring-fuchsia-400/30 hover:ring-fuchsia-400/50 flex flex-col items-center justify-center gap-1 transition disabled:opacity-60"
          >
            <Plus className="w-5 h-5 text-fuchsia-300" />
            <span className="text-[10px] font-semibold text-white/70">várias fotos</span>
          </button>
        )}
      </div>

      <TipCallout emoji="🎴">
        Cada foto vira um par de cartas. Escolhe <strong>{Math.min(Math.max(imgs.length, 3), 6)} fotos</strong> que marcaram — viagens, jantares, selfies bobas.
      </TipCallout>
    </div>
  );
}

// ───────────────────────────────────────────────────
// Sub-form: Quiz
// ───────────────────────────────────────────────────
function QuizSubForm() {
  const { control, register, watch, setValue } = useFormContext<PageData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'quizQuestions' });
  const questions = watch('quizQuestions') ?? [];

  const addQuestion = () => {
    append({
      questionText: '',
      options: [{ text: '' }, { text: '' }, { text: '' }],
      correctAnswerIndex: 0,
    } as any);
  };

  const addOption = (qi: number) => {
    const current = questions[qi]?.options ?? [];
    if (current.length >= 4) return;
    setValue(`quizQuestions.${qi}.options` as any, [...current, { text: '' }], { shouldDirty: true });
  };

  const removeOption = (qi: number, oi: number) => {
    const current = questions[qi]?.options ?? [];
    if (current.length <= 2) return;
    const next = current.filter((_: any, idx: number) => idx !== oi);
    const correct = questions[qi]?.correctAnswerIndex ?? 0;
    const newCorrect = correct === oi ? 0 : correct > oi ? correct - 1 : correct;
    setValue(`quizQuestions.${qi}.options` as any, next, { shouldDirty: true });
    setValue(`quizQuestions.${qi}.correctAnswerIndex` as any, newCorrect, { shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <button
          type="button"
          onClick={addQuestion}
          className="w-full rounded-xl p-4 bg-gradient-to-br from-purple-500/15 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/15 ring-2 ring-dashed ring-purple-400/30 hover:ring-purple-400/50 flex flex-col items-center justify-center gap-1.5 transition"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-white">Criar primeira pergunta</span>
          <span className="text-[11px] text-white/50">até 5 no total</span>
        </button>
      )}

      {fields.map((f, qi) => {
        const q: any = questions[qi] ?? {};
        const optionCount = q.options?.length ?? 0;
        return (
          <div key={f.id} className="rounded-xl bg-gradient-to-br from-purple-500/8 to-pink-500/4 ring-1 ring-purple-400/20 p-3 space-y-2.5 relative">
            <div className="flex items-center justify-between">
              <SectionLabel n={qi + 1}>pergunta</SectionLabel>
              <button
                type="button"
                onClick={() => remove(qi)}
                className="p-1 text-white/40 hover:text-red-400 transition"
                aria-label="Remover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              {...register(`quizQuestions.${qi}.questionText` as any)}
              placeholder="Ex: Qual o meu filme favorito?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.06] ring-1 ring-white/15 focus:ring-2 focus:ring-purple-400/60 text-[13px] text-white placeholder:text-white/35 focus:outline-none transition resize-none"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/50">
                  Opções · toca na correta ✓
                </span>
              </div>
              <Controller
                control={control}
                name={`quizQuestions.${qi}.correctAnswerIndex` as any}
                render={({ field: correctField }) => (
                  <div className="space-y-1.5">
                    {(q.options ?? []).map((_opt: any, oi: number) => {
                      const isCorrect = correctField.value === oi;
                      return (
                        <div key={oi} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => correctField.onChange(oi)}
                            className={cn(
                              'w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition',
                              isCorrect
                                ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-[0_0_0_3px_rgba(16,185,129,0.2)]'
                                : 'bg-white/[0.05] text-white/40 ring-1 ring-white/15 hover:ring-white/30'
                            )}
                          >
                            {isCorrect ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <span className="text-[10px] font-bold">{String.fromCharCode(65 + oi)}</span>}
                          </button>
                          <input
                            {...register(`quizQuestions.${qi}.options.${oi}.text` as any)}
                            placeholder={`Resposta ${String.fromCharCode(65 + oi)}`}
                            className={cn(
                              'flex-1 h-9 px-3 rounded-lg text-[13px] text-white placeholder:text-white/35 focus:outline-none transition',
                              isCorrect
                                ? 'bg-emerald-500/10 ring-1 ring-emerald-400/40 focus:ring-2 focus:ring-emerald-400/60'
                                : 'bg-white/[0.04] ring-1 ring-white/10 focus:ring-2 focus:ring-purple-400/50'
                            )}
                          />
                          {optionCount > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qi, oi)}
                              className="p-1 text-white/30 hover:text-red-400 transition"
                              aria-label="Remover opção"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              />
              {optionCount < 4 && (
                <button
                  type="button"
                  onClick={() => addOption(qi)}
                  className="w-full h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] ring-1 ring-dashed ring-white/15 hover:ring-purple-400/40 text-[11.5px] font-semibold text-white/70 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3 h-3" /> Mais uma opção
                </button>
              )}
            </div>
          </div>
        );
      })}

      {fields.length > 0 && fields.length < 5 && (
        <button
          type="button"
          onClick={addQuestion}
          className="w-full h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-dashed ring-white/20 hover:ring-purple-400/40 text-[13px] font-semibold text-white/80 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Mais uma pergunta <span className="text-white/40 text-[11px]">({fields.length}/5)</span>
        </button>
      )}

      {fields.length > 0 && (
        <TipCallout emoji="💭">
          Mistura fácil com difícil: <strong>"qual minha comida favorita"</strong> junto com <strong>"qual foi o primeiro filme que vimos juntos"</strong>.
        </TipCallout>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────
// Sub-form: WordGame
// ───────────────────────────────────────────────────
function WordGameSubForm() {
  const { control, register, watch } = useFormContext<PageData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'wordGameQuestions' });
  const questions = watch('wordGameQuestions') ?? [];

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <button
          type="button"
          onClick={() => append({ question: '', answer: '', hint: '' } as any)}
          className="w-full rounded-xl p-4 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 hover:from-violet-500/20 hover:to-fuchsia-500/15 ring-2 ring-dashed ring-violet-400/30 hover:ring-violet-400/50 flex flex-col items-center justify-center gap-1.5 transition"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-white">Criar primeira palavra</span>
          <span className="text-[11px] text-white/50">até 4 no total</span>
        </button>
      )}

      {fields.map((f, i) => {
        const q: any = questions[i] ?? {};
        const answer = (q.answer ?? '').toUpperCase();
        return (
          <div key={f.id} className="rounded-xl bg-gradient-to-br from-violet-500/8 to-fuchsia-500/4 ring-1 ring-violet-400/20 p-3 space-y-2.5 relative">
            <div className="flex items-center justify-between">
              <SectionLabel n={i + 1}>palavra</SectionLabel>
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1 text-white/40 hover:text-red-400 transition"
                aria-label="Remover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/50 px-0.5">
                Pergunta / dica
              </label>
              <input
                {...register(`wordGameQuestions.${i}.question` as any)}
                placeholder="Ex: Cidade da nossa primeira viagem"
                className="w-full h-10 px-3 rounded-lg bg-white/[0.06] ring-1 ring-white/15 focus:ring-2 focus:ring-violet-400/60 text-[13px] text-white placeholder:text-white/35 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/50 px-0.5">
                Resposta (a palavra certa)
              </label>
              <input
                {...register(`wordGameQuestions.${i}.answer` as any)}
                placeholder="PARIS"
                className="w-full h-10 px-3 rounded-lg bg-violet-500/10 ring-1 ring-violet-400/40 focus:ring-2 focus:ring-violet-400/70 text-[14px] font-bold text-violet-100 placeholder:text-violet-200/30 focus:outline-none transition uppercase tracking-wider"
                style={{ textTransform: 'uppercase' }}
              />
              {answer && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {answer.split('').map((ch: string, ci: number) => (
                    <div
                      key={ci}
                      className={cn(
                        'w-7 h-8 rounded-md flex items-center justify-center text-[13px] font-bold',
                        ch === ' '
                          ? 'w-3 bg-transparent'
                          : 'bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/40 shadow-inner'
                      )}
                    >
                      {ch === ' ' ? '' : '_'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/50 px-0.5 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Dica extra (opcional)
              </label>
              <input
                {...register(`wordGameQuestions.${i}.hint` as any)}
                placeholder="Ex: A cidade do amor"
                className="w-full h-9 px-3 rounded-lg bg-white/[0.04] ring-1 ring-white/10 focus:ring-2 focus:ring-violet-400/50 text-[12px] text-white placeholder:text-white/35 focus:outline-none transition"
              />
            </div>
          </div>
        );
      })}

      {fields.length > 0 && fields.length < 4 && (
        <button
          type="button"
          onClick={() => append({ question: '', answer: '', hint: '' } as any)}
          className="w-full h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-dashed ring-white/20 hover:ring-violet-400/40 text-[13px] font-semibold text-white/80 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Mais uma palavra <span className="text-white/40 text-[11px]">({fields.length}/4)</span>
        </button>
      )}

      {fields.length > 0 && (
        <TipCallout emoji="✨">
          Funciona tipo <strong>forca romântica</strong> — mistura palavras fáceis (nomes, apelidos) com datas ou lugares importantes.
        </TipCallout>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────
// Hint + Dispatcher
// ───────────────────────────────────────────────────
function PreviewHint({ k }: { k: ExtraConfig['key'] }) {
  const locale = useLocale();
  const isEN = locale === 'en';
  const MAP_PT: Record<ExtraConfig['key'], { emoji: string; hint: string; cls: string }> = {
    enablePuzzle: { emoji: '🧩', hint: 'Ele(a) vai montar peça por peça pra revelar sua foto', cls: 'bg-gradient-to-br from-pink-500/10 to-rose-500/5 ring-pink-400/25' },
    enableMemoryGame: { emoji: '🎴', hint: 'Pares de cartas com fotos de vocês — vira as cartas e acha os pares', cls: 'bg-gradient-to-br from-fuchsia-500/10 to-pink-500/5 ring-fuchsia-400/25' },
    enableQuiz: { emoji: '❓', hint: 'Perguntas personalizadas que só quem te conhece responde', cls: 'bg-gradient-to-br from-purple-500/10 to-pink-500/5 ring-purple-400/25' },
    enableWordGame: { emoji: '🔤', hint: 'Forca romântica — descobre a palavra letra por letra', cls: 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 ring-violet-400/25' },
  };
  const MAP_EN: Record<ExtraConfig['key'], { emoji: string; hint: string; cls: string }> = {
    enablePuzzle: { emoji: '🧩', hint: 'They\'ll solve it piece by piece to reveal your photo', cls: 'bg-gradient-to-br from-pink-500/10 to-rose-500/5 ring-pink-400/25' },
    enableMemoryGame: { emoji: '🎴', hint: 'Pairs of cards with your photos — flip and match them', cls: 'bg-gradient-to-br from-fuchsia-500/10 to-pink-500/5 ring-fuchsia-400/25' },
    enableQuiz: { emoji: '❓', hint: 'Custom questions only someone who knows you can answer', cls: 'bg-gradient-to-br from-purple-500/10 to-pink-500/5 ring-purple-400/25' },
    enableWordGame: { emoji: '🔤', hint: 'Romantic hangman — crack the word letter by letter', cls: 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 ring-violet-400/25' },
  };
  const { emoji, hint, cls } = (isEN ? MAP_EN : MAP_PT)[k];
  return (
    <div className={cn('rounded-lg px-3 py-2 ring-1 flex items-start gap-2.5', cls)}>
      <span className="text-lg leading-none shrink-0">{emoji}</span>
      <p className="text-[11.5px] text-white/85 leading-snug">{hint}</p>
    </div>
  );
}

function SubForm({ k }: { k: ExtraConfig['key'] }) {
  return (
    <div className="space-y-3">
      <PreviewHint k={k} />
      {k === 'enablePuzzle' && <PuzzleSubForm />}
      {k === 'enableMemoryGame' && <MemorySubForm />}
      {k === 'enableQuiz' && <QuizSubForm />}
      {k === 'enableWordGame' && <WordGameSubForm />}
    </div>
  );
}

export default function ExtrasField() {
  const { control, watch } = useFormContext<PageData>();
  const locale = useLocale();
  const isEN = locale === 'en';
  const EXTRAS = isEN ? EXTRAS_EN : EXTRAS_PT;

  return (
    <div className="space-y-2.5">
      {EXTRAS.map(({ key, icon: Icon, label, desc, accent }) => {
        const enabled = watch(key);
        return (
          <Controller
            key={key}
            control={control}
            name={key}
            render={({ field }) => (
              <div
                className={cn(
                  'rounded-2xl transition overflow-hidden',
                  enabled
                    ? 'bg-white/[0.06] ring-1 ring-white/25 shadow-[0_8px_28px_-12px_rgba(236,72,153,0.3)]'
                    : 'bg-white/[0.03] ring-1 ring-white/10'
                )}
              >
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <div
                    className={cn(
                      'w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition',
                      enabled
                        ? `bg-gradient-to-br ${accent} text-white shadow-[0_6px_20px_-6px_rgba(236,72,153,0.55)]`
                        : 'bg-white/[0.05] text-white/55 ring-1 ring-white/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-semibold text-white leading-tight">{label}</div>
                    <div className="text-[11.5px] text-white/55 mt-0.5">{desc}</div>
                  </div>
                  <div
                    className={cn(
                      'relative w-10 h-5.5 rounded-full transition shrink-0',
                      enabled ? 'bg-pink-500 shadow-[0_0_0_3px_rgba(236,72,153,0.15)]' : 'bg-white/15'
                    )}
                    style={{ height: '22px' }}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-md transition-transform',
                        enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3.5 pt-1 border-t border-white/[0.07]">
                        <SubForm k={key} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          />
        );
      })}
    </div>
  );
}
