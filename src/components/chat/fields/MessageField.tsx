'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { Bold, Italic, Strikethrough, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/wizard-schema';
import { useLocale } from 'next-intl';

interface MessageFieldProps {
  placeholder?: string;
}

// Tailwind classes válidas — batem com as que o PageClientComponent consome via
// className. Ordem: do menor pro maior, pra slider virar natural.
const FONT_SIZES: { value: string; label: { pt: string; en: string } }[] = [
  { value: 'text-sm',  label: { pt: 'Pequeno', en: 'Small'  } },
  { value: 'text-base', label: { pt: 'Normal', en: 'Normal' } },
  { value: 'text-lg',  label: { pt: 'Médio',   en: 'Medium' } },
  { value: 'text-xl',  label: { pt: 'Grande',  en: 'Large'  } },
  { value: 'text-2xl', label: { pt: 'Gigante', en: 'Huge'   } },
];

// Templates por segmento — 3 tons diferentes (romântico/leve/profundo) pra
// ajudar quem trava na hora de escrever. User clica no card e o texto vai
// pro textarea (substitui o conteúdo atual).
type TemplateSet = { pt: string[]; en: string[] };
const TEMPLATES: Record<string, TemplateSet> = {
  namorade: {
    pt: [
      'Desde o dia que te conheci, tudo na minha vida virou mais bonito. Você é meu lugar favorito do mundo, meu sorriso de manhã, meu sono em paz à noite. Te amar é a coisa mais leve que eu já fiz.',
      'Não sei explicar o que sinto quando olho pra você. É um tipo de calma que só você me dá, um tipo de saudade mesmo quando você tá perto. Obrigado(a) por existir do jeito que existe — eu te escolho todo dia.',
      'Eu poderia escrever um livro inteiro sobre você e ainda ia faltar palavra. Você mudou tudo em mim. A minha vida tem muito mais sentido com você dentro dela. Te amo demais — pra hoje, amanhã e pra sempre.',
    ],
    en: [
      'From the day I met you, everything in my life got more beautiful. You\'re my favorite place in the world, my morning smile, my peaceful sleep. Loving you is the lightest thing I\'ve ever done.',
      'I can\'t explain what I feel when I look at you. It\'s a kind of calm only you give me, a kind of missing you even when you\'re right here. Thank you for being who you are — I choose you every day.',
      'I could write a whole book about you and still run out of words. You changed everything in me. My life makes so much more sense with you in it. I love you so much — today, tomorrow, and forever.',
    ],
  },
  mae: {
    pt: [
      'Mãe, eu nunca vou conseguir colocar em palavras o quanto você significa pra mim. Você é minha referência, meu porto seguro, meu maior amor. Tudo que eu sou hoje começa em você.',
      'Lembro de tudo que você fez por mim, mãe — as noites mal dormidas, os almoços feitos com cuidado, os abraços que curavam tudo. Eu sou eternamente grato(a). Te amo com toda a minha vida.',
      'Mãe, você é o tipo de pessoa que faz o mundo ser melhor só de existir nele. Espero que você saiba o tamanho do amor que eu tenho por você. Hoje e sempre — você é minha base, minha força, minha rainha.',
    ],
    en: [
      'Mom, I\'ll never be able to put into words how much you mean to me. You\'re my reference, my safe place, my biggest love. Everything I am today starts with you.',
      'I remember everything you did for me, Mom — the sleepless nights, the meals made with care, the hugs that healed everything. I\'m forever grateful. I love you with all my life.',
      'Mom, you\'re the kind of person who makes the world better just by being in it. I hope you know how big my love for you is. Today and always — you\'re my foundation, my strength, my queen.',
    ],
  },
  pai: {
    pt: [
      'Pai, você é o homem que eu admiro mais do que qualquer outro. Tudo que você me ensinou — a trabalhar, a respeitar, a ser firme — eu carrego comigo todo dia. Te amo demais.',
      'Pai, obrigado(a) por estar sempre presente, do seu jeito. Por cada conselho, cada conversa, cada vez que você me mostrou que eu podia ir mais longe. Você é meu maior exemplo.',
      'Eu tive sorte de ter você como pai. Mesmo nas horas difíceis, você nunca soltou a minha mão. Espero te orgulhar todos os dias da minha vida. Te amo, meu velho.',
    ],
    en: [
      'Dad, you\'re the man I admire more than anyone else. Everything you taught me — to work hard, to respect, to stand firm — I carry with me every day. I love you so much.',
      'Dad, thank you for always being there in your own way. For every piece of advice, every conversation, every time you showed me I could go further. You\'re my biggest example.',
      'I was lucky to have you as my dad. Even in tough times, you never let go of my hand. I hope to make you proud every day of my life. Love you, old man.',
    ],
  },
  espouse: {
    pt: [
      'Casar com você foi a melhor decisão da minha vida. Cada dia ao seu lado é uma confirmação de que escolhi certo. Você é minha família, meu lar, meu pra sempre.',
      'Os anos passaram e o meu amor por você só cresceu. Vimos tanta coisa juntos, rimos, choramos, construímos. Tudo isso só faz sentido porque é com você. Te amo cada dia mais.',
      'Você é a pessoa que eu escolhi pra dividir a vida e eu escolheria de novo, mil vezes. Obrigado(a) por ser meu(minha) parceiro(a) em tudo. Eu te amo de um jeito que não cabe em palavras.',
    ],
    en: [
      'Marrying you was the best decision of my life. Every day by your side is confirmation I chose right. You\'re my family, my home, my forever.',
      'Years have passed and my love for you has only grown. We\'ve seen so much together — laughed, cried, built. All of it only makes sense because it\'s with you. I love you more every day.',
      'You\'re the person I chose to share life with, and I\'d choose you again, a thousand times. Thank you for being my partner in everything. I love you in a way words can\'t hold.',
    ],
  },
  amige: {
    pt: [
      'Amizade que vira família é raridade — e eu tenho muita sorte de ter você. Obrigado(a) por estar em todos os momentos importantes da minha vida. Você é insubstituível.',
      'Tem amigo que é só amigo. E tem amigo que é da vida toda. Você é desse segundo time. Sem você as histórias nem teriam graça. Te amo demais, na real.',
      'Aqui é só um obrigado(a) — pelas risadas, pelas conversas que duraram a madrugada toda, pelos perrengues que viraram piada depois. Você é uma das melhores coisas que aconteceram comigo.',
    ],
    en: [
      'A friendship that becomes family is rare — and I\'m so lucky to have you. Thank you for being in every important moment of my life. You\'re irreplaceable.',
      'Some friends are just friends. Others are for life. You\'re the second kind. Without you the stories wouldn\'t even be fun. I love you, for real.',
      'This is just a thank you — for the laughs, for the conversations that lasted till dawn, for the messes that became inside jokes. You\'re one of the best things that happened to me.',
    ],
  },
  avo: {
    pt: [
      'Vó/Vô, você é o tipo de pessoa que faz o mundo girar mais devagar — do jeito bom. Aquele cheiro de comida feita com amor, aquele abraço quente, aquela sabedoria que só você tem. Eu te amo muito.',
      'Crescer perto de você foi um privilégio que pouca gente tem. Cada história que você conta, cada conselho, cada lembrança — eu guardo tudo. Você é parte de tudo que eu sou.',
      'Eu queria que você soubesse o tamanho do amor que eu sinto. Você sempre vai ser o lugar mais seguro do mundo pra mim. Obrigado(a) por tudo, hoje e sempre.',
    ],
    en: [
      'Grandma/Grandpa, you\'re the kind of person who makes the world spin slower — in the best way. That smell of food made with love, that warm hug, that wisdom only you have. I love you so much.',
      'Growing up close to you was a privilege few people have. Every story you tell, every piece of advice, every memory — I keep them all. You\'re part of everything I am.',
      'I wish you knew how big my love is. You\'ll always be the safest place in the world for me. Thank you for everything, today and always.',
    ],
  },
  filho: {
    pt: [
      'Filho(a), você foi o melhor presente que a vida me deu. Cada sorriso seu vale o mundo. Espero te dar tanto amor que ele nunca acabe — e que você cresça sabendo o quanto é amado(a).',
      'Te ver crescer é a coisa mais linda que eu já vivi. Você me ensina todo dia o que é amar de verdade. Eu vou estar com você em cada passo — pra rir, pra chorar, pra comemorar.',
      'Não importa o tamanho que você fique, vai ser sempre o(a) meu(minha) pequeno(a). Que esse amor que eu sinto te lembre, em cada momento difícil, que você nunca tá sozinho(a). Te amo infinito.',
    ],
    en: [
      'Kiddo, you were the best gift life ever gave me. Every smile of yours is worth the world. I hope to give you so much love that it never runs out — and that you grow up knowing how loved you are.',
      'Watching you grow is the most beautiful thing I\'ve ever lived. You teach me every day what real love is. I\'ll be with you every step — to laugh, to cry, to celebrate.',
      'No matter how big you get, you\'ll always be my little one. May this love I feel remind you, in every hard moment, that you\'re never alone. I love you infinitely.',
    ],
  },
};
const TEMPLATE_LABELS_PT = ['Romântico', 'Carinhoso', 'Profundo'];
const TEMPLATE_LABELS_EN = ['Romantic', 'Sweet', 'Deep'];

export default function MessageField({
  placeholder = 'Desde o dia que te conheci...',
}: MessageFieldProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<PageData>();
  const value = watch('message');
  const fontSize = watch('messageFontSize') || 'text-base';
  const formatting = (watch('messageFormatting') || []) as string[];
  const err = errors.message?.message;
  const locale = useLocale();
  const isEN = locale === 'en';
  const searchParams = useSearchParams();
  const segment = (searchParams.get('segment') || 'namorade') as keyof typeof TEMPLATES;
  const templates = TEMPLATES[segment] || TEMPLATES.namorade;
  const templateList = isEN ? templates.en : templates.pt;
  const templateLabels = isEN ? TEMPLATE_LABELS_EN : TEMPLATE_LABELS_PT;

  const applyTemplate = (text: string) => {
    setValue('message', text, { shouldDirty: true, shouldValidate: true });
  };

  const toggleFormat = (f: 'bold' | 'italic' | 'strikethrough') => {
    const next = formatting.includes(f) ? formatting.filter((x) => x !== f) : [...formatting, f];
    setValue('messageFormatting', next, { shouldDirty: true });
  };

  const isBold = formatting.includes('bold');
  const isItalic = formatting.includes('italic');
  const isStrike = formatting.includes('strikethrough');

  return (
    <div className="space-y-4">
      {/* Toolbar: bold / italic / strike */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.15em] text-white/45 font-semibold mr-1">
          {isEN ? 'Style' : 'Estilo'}
        </span>
        {([
          { k: 'bold' as const, icon: Bold, label: isEN ? 'Bold' : 'Negrito', active: isBold },
          { k: 'italic' as const, icon: Italic, label: isEN ? 'Italic' : 'Itálico', active: isItalic },
          { k: 'strikethrough' as const, icon: Strikethrough, label: isEN ? 'Strike' : 'Riscado', active: isStrike },
        ]).map(({ k, icon: Icon, label, active }) => (
          <button
            key={k}
            type="button"
            onClick={() => toggleFormat(k)}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              'w-9 h-9 rounded-lg transition active:scale-95 flex items-center justify-center ring-1',
              active
                ? 'bg-pink-500/25 ring-pink-400/60 text-white shadow-[0_0_12px_-2px_rgba(236,72,153,0.5)]'
                : 'bg-white/[0.04] ring-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Templates sugeridos — 3 sugestões por segmento. Cuida do "branco" da
          página em branco — quem trava na hora de escrever clica e edita. */}
      {templateList && templateList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/45 font-semibold">
            <Sparkles className="w-3 h-3 text-pink-300" />
            <span>{isEN ? 'Need help? Try one of these' : 'Sem ideia? Tenta uma dessas'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {templateList.map((tpl, i) => {
              const isCurrent = value === tpl;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={cn(
                    'group text-left p-3 rounded-xl ring-1 transition active:scale-[0.99]',
                    isCurrent
                      ? 'bg-pink-500/15 ring-pink-400/50 shadow-[0_0_16px_-4px_rgba(236,72,153,0.4)]'
                      : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.06] hover:ring-white/20'
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={cn(
                      'text-[10px] uppercase tracking-wider font-bold',
                      isCurrent ? 'text-pink-300' : 'text-white/50'
                    )}>
                      {templateLabels[i]}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-200 font-bold">
                        ✓ {isEN ? 'using' : 'em uso'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-white/70 leading-snug line-clamp-3 group-hover:text-white/90 transition">
                    {tpl}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-[10.5px] text-white/35 px-1">
            {isEN ? 'Click one and edit freely — make it yours.' : 'Clica numa e edita à vontade — deixa do seu jeito.'}
          </p>
        </div>
      )}

      {/* Textarea — preview das escolhas em tempo real (fontSize + formatting aplicados no class) */}
      <div className="space-y-2">
        <textarea
          {...register('message')}
          placeholder={placeholder}
          autoFocus
          maxLength={2000}
          className={cn(
            'w-full min-h-[200px] px-4 py-3 rounded-xl leading-relaxed text-white placeholder:text-white/35',
            'bg-white/[0.04] ring-1 ring-white/10 backdrop-blur resize-none',
            'focus:bg-white/[0.06] focus:ring-2 focus:ring-pink-500/50 focus:outline-none',
            'transition-all',
            fontSize,
            isBold && 'font-bold',
            isItalic && 'italic',
            isStrike && 'line-through',
            err && 'ring-red-500/60 focus:ring-red-500/70'
          )}
        />
        <div className="flex justify-between items-center text-[11px] px-1 min-h-[14px]">
          <span className="text-red-400/90">{err}</span>
          <span className="text-white/40 tabular-nums">{(value?.length ?? 0)}/2000</span>
        </div>
      </div>

      {/* Font size selector — pills clicáveis com preview do tamanho */}
      <div className="rounded-xl p-3 bg-white/[0.03] ring-1 ring-white/10">
        <div className="text-[11px] uppercase tracking-[0.15em] text-white/50 font-semibold mb-2.5">
          {isEN ? 'Text size' : 'Tamanho do texto'}
        </div>
        <div className="flex flex-wrap gap-2">
          {FONT_SIZES.map((s) => {
            const selected = fontSize === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setValue('messageFontSize', s.value, { shouldDirty: true })}
                aria-pressed={selected}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition ring-1 font-medium',
                  s.value, // preview: botão renderiza com a própria classe de tamanho
                  selected
                    ? 'bg-pink-500/20 ring-pink-400/60 text-white'
                    : 'bg-white/[0.04] ring-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white'
                )}
              >
                {s.label[isEN ? 'en' : 'pt']}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
