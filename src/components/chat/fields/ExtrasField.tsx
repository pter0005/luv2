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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { uploadFile } from '@/lib/upload';
import { compressImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import type { PageData } from '@/lib/wizard-schema';

interface ExtraConfig {
  key: 'enablePuzzle' | 'enableMemoryGame' | 'enableQuiz' | 'enableWordGame';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}

const EXTRAS: ExtraConfig[] = [
  { key: 'enablePuzzle', icon: PuzzleIcon, label: 'Quebra-cabeça', desc: 'Precisa montar pra ver a surpresa' },
  { key: 'enableMemoryGame', icon: Gamepad2, label: 'Jogo da memória', desc: 'Pares de cartas com fotos' },
  { key: 'enableQuiz', icon: HelpCircle, label: 'Quiz do casal', desc: 'Perguntas que só ele(a) saberia' },
  { key: 'enableWordGame', icon: Wand2, label: 'Adivinhe a palavra', desc: 'Jogo de palavras temáticas' },
];

// ---- Sub-form: Puzzle ----
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
      setValue('puzzleImage', uploaded, { shouldDirty: true });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err?.message ?? 'Tente de novo' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
      {img?.url ? (
        <div className="relative aspect-square w-full max-w-[160px] rounded-lg overflow-hidden bg-white/[0.05] ring-1 ring-white/10">
          <Image src={img.url} alt="" fill className="object-cover" sizes="160px" />
          <button
            type="button"
            onClick={() => setValue('puzzleImage', undefined, { shouldDirty: true })}
            className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-11 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-dashed ring-white/15 text-sm text-white/80 flex items-center justify-center gap-2 transition"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Enviando…' : 'Foto do quebra-cabeça'}
        </button>
      )}
      <p className="text-[11px] text-white/45 px-1">Uma foto especial — ele(a) vai montar peça por peça</p>
    </div>
  );
}

// ---- Sub-form: Memory Game ----
function MemorySubForm() {
  const { watch, setValue } = useFormContext<PageData>();
  const imgs = watch('memoryGameImages') ?? [];
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const firebase = useFirebase();
  const { toast } = useToast();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 6 - imgs.length;
    const selected = Array.from(files).slice(0, remaining);
    if (!selected.length) return;
    let activeUser = user;
    if (!activeUser && firebase.auth) {
      const cred = await signInAnonymously(firebase.auth);
      activeUser = cred.user;
    }
    if (!activeUser) return;
    setUploading(true);
    try {
      const uploaded: any[] = [];
      for (const file of selected) {
        const compressed = await compressImage(file, 1000, 0.82);
        const up = await uploadFile(firebase.storage, activeUser.uid, compressed, 'memory');
        uploaded.push(up);
      }
      setValue('memoryGameImages', [...imgs, ...uploaded] as any, { shouldDirty: true });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err?.message ?? 'Tente de novo' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />
      {imgs.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {imgs.map((im: any, i: number) => (
            <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-white/[0.05] ring-1 ring-white/10">
              <Image src={im.url} alt="" fill className="object-cover" sizes="80px" />
              <button
                type="button"
                onClick={() => setValue('memoryGameImages', imgs.filter((_: any, idx: number) => idx !== i) as any, { shouldDirty: true })}
                className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {imgs.length < 6 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-11 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-dashed ring-white/15 text-sm text-white/80 flex items-center justify-center gap-2 transition"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Enviando…' : `Fotos (${imgs.length}/6)`}
        </button>
      )}
      <p className="text-[11px] text-white/45 px-1">Mínimo 3 fotos pra formar os pares</p>
    </div>
  );
}

// ---- Sub-form: Quiz ----
function QuizSubForm() {
  const { control } = useFormContext<PageData>();
  const { fields, append, remove, update } = useFieldArray({ control, name: 'quizQuestions' });

  const addQuestion = () => {
    append({
      questionText: '',
      options: [{ text: '' }, { text: '' }],
      correctAnswerIndex: null,
    } as any);
  };

  return (
    <div className="space-y-2">
      {fields.map((f, i) => {
        const v: any = f;
        return (
          <div key={f.id} className="rounded-lg bg-white/[0.03] ring-1 ring-white/10 p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Pergunta ${i + 1}`}
                defaultValue={v.questionText}
                onBlur={(e) => update(i, { ...v, questionText: e.target.value })}
                className="flex-1 h-9 px-3 rounded-md bg-white/[0.04] ring-1 ring-white/10 text-[13px] text-white placeholder:text-white/35 focus:outline-none focus:ring-pink-500/40"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1.5 text-white/50 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(v.options ?? []).map((o: any, oi: number) => (
                <input
                  key={oi}
                  type="text"
                  placeholder={`Opção ${oi + 1}${v.correctAnswerIndex === oi ? ' ✓' : ''}`}
                  defaultValue={o.text}
                  onBlur={(e) => {
                    const opts = [...v.options];
                    opts[oi] = { text: e.target.value };
                    update(i, { ...v, options: opts });
                  }}
                  onFocus={() => update(i, { ...v, correctAnswerIndex: v.correctAnswerIndex ?? oi })}
                  className="h-8 px-2.5 rounded-md bg-white/[0.03] ring-1 ring-white/10 text-[12px] text-white placeholder:text-white/35 focus:outline-none focus:ring-pink-500/40"
                />
              ))}
            </div>
            <select
              defaultValue={v.correctAnswerIndex ?? ''}
              onChange={(e) => update(i, { ...v, correctAnswerIndex: Number(e.target.value) })}
              className="w-full h-8 px-2 rounded-md bg-white/[0.03] ring-1 ring-white/10 text-[11.5px] text-white/80 focus:outline-none"
            >
              <option value="" disabled>Resposta correta</option>
              {(v.options ?? []).map((_: any, oi: number) => (
                <option key={oi} value={oi}>Opção {oi + 1}</option>
              ))}
            </select>
          </div>
        );
      })}
      {fields.length < 5 && (
        <button
          type="button"
          onClick={addQuestion}
          className="w-full h-10 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-dashed ring-white/15 text-sm text-white/80 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Adicionar pergunta
        </button>
      )}
      <p className="text-[11px] text-white/45 px-1">Máximo 5 perguntas</p>
    </div>
  );
}

// ---- Sub-form: WordGame ----
function WordGameSubForm() {
  const { control } = useFormContext<PageData>();
  const { fields, append, remove, update } = useFieldArray({ control, name: 'wordGameQuestions' });

  return (
    <div className="space-y-2">
      {fields.map((f, i) => {
        const v: any = f;
        return (
          <div key={f.id} className="rounded-lg bg-white/[0.03] ring-1 ring-white/10 p-2.5 space-y-1.5 relative">
            <input
              type="text"
              placeholder="Pergunta/dica"
              defaultValue={v.question}
              onBlur={(e) => update(i, { ...v, question: e.target.value })}
              className="w-full h-8 px-2.5 rounded-md bg-white/[0.04] ring-1 ring-white/10 text-[12px] text-white placeholder:text-white/35 focus:outline-none focus:ring-pink-500/40"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                placeholder="Resposta"
                defaultValue={v.answer}
                onBlur={(e) => update(i, { ...v, answer: e.target.value })}
                className="h-8 px-2.5 rounded-md bg-white/[0.03] ring-1 ring-white/10 text-[12px] text-white placeholder:text-white/35 focus:outline-none focus:ring-pink-500/40"
              />
              <input
                type="text"
                placeholder="Dica extra"
                defaultValue={v.hint}
                onBlur={(e) => update(i, { ...v, hint: e.target.value })}
                className="h-8 px-2.5 rounded-md bg-white/[0.03] ring-1 ring-white/10 text-[12px] text-white placeholder:text-white/35 focus:outline-none focus:ring-pink-500/40"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1.5 right-1.5 p-1 text-white/50 hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      {fields.length < 4 && (
        <button
          type="button"
          onClick={() => append({ question: '', answer: '', hint: '' } as any)}
          className="w-full h-10 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-dashed ring-white/15 text-sm text-white/80 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Adicionar palavra
        </button>
      )}
      <p className="text-[11px] text-white/45 px-1">Máximo 4 palavras</p>
    </div>
  );
}

function SubForm({ k }: { k: ExtraConfig['key'] }) {
  switch (k) {
    case 'enablePuzzle': return <PuzzleSubForm />;
    case 'enableMemoryGame': return <MemorySubForm />;
    case 'enableQuiz': return <QuizSubForm />;
    case 'enableWordGame': return <WordGameSubForm />;
  }
}

export default function ExtrasField() {
  const { control, watch } = useFormContext<PageData>();

  return (
    <div className="space-y-2">
      {EXTRAS.map(({ key, icon: Icon, label, desc }) => {
        const enabled = watch(key);
        return (
          <Controller
            key={key}
            control={control}
            name={key}
            render={({ field }) => (
              <div
                className={cn(
                  'rounded-xl transition',
                  enabled
                    ? 'bg-white/[0.06] ring-1 ring-white/25'
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
                      'w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition',
                      enabled
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-[0_6px_20px_-6px_rgba(236,72,153,0.55)]'
                        : 'bg-white/[0.05] text-white/55 ring-1 ring-white/10'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white">{label}</div>
                    <div className="text-[12px] text-white/55">{desc}</div>
                  </div>
                  <div
                    className={cn(
                      'relative w-9 h-5 rounded-full transition shrink-0',
                      enabled ? 'bg-pink-500' : 'bg-white/15'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                        enabled ? 'translate-x-4' : 'translate-x-0.5'
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
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 border-t border-white/[0.06]">
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

      <p className="text-[11.5px] text-center text-white/45 pt-1">
        Tudo opcional. Liga só o que você curtir — dá pra configurar depois também.
      </p>
    </div>
  );
}
