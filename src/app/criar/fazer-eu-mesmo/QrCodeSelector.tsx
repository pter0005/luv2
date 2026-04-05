'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

const QR_OPTIONS = [
  {
    id: 'classic',
    title: 'Clássico',
    price: 0,
    preview: null, // só QR simples
    qrColor: '#000000',
    qrX: 0, qrY: 0, qrSize: 0, // não usa
  },
  {
    id: 'juntos',
    title: 'Juntos para Sempre',
    price: 3.90,
    preview: '/qr-templates/juntos-sempre.png',
    qrColor: '#8B0000',
    // coordenadas em % da imagem (1400x2000)
    qrXPct: 0.286,  // 400/1400
    qrYPct: 0.454,  // 908/2000
    qrSizePct: 0.429, // 600/1400
  },
  {
    id: 'gato',
    title: 'Te Amo Gatinho',
    price: 3.90,
    preview: '/qr-templates/gato-te-amo.png',
    qrColor: '#CC2200',
    qrXPct: 0.300,
    qrYPct: 0.282,
    qrSizePct: 0.400,
  },
  {
    id: 'surpresa',
    title: 'Surpresa Pra Você',
    price: 3.90,
    preview: '/qr-templates/surpresa-pra-voce.png',
    qrColor: '#fabedb',
    qrXPct: 0.256,
    qrYPct: 0.376,
    qrSizePct: 0.485,
    transparent: true,
  },
  {
    id: 'qrcode-coelho',
    title: '🐰 Feliz Páscoa',
    price: 3.90,
    preview: '/qr-templates/qrcode-coelho .png',
    qrColor: '#000000',
    qrXPct: 0.292,
    qrYPct: 0.393,
    qrSizePct: 0.417,
  },
];

interface Props {
  value: string;
  onChange: (id: string) => void;
  onPriceChange: (price: number) => void;
}

// Mini preview: desenha a imagem de fundo + QR em cima via canvas
function TemplatePreview({ template, pageUrl }: { template: typeof QR_OPTIONS[1], pageUrl?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    if (!template.preview) {
      // Clássico: fundo branco + QR
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(W * 0.15, H * 0.15, W * 0.7, H * 0.7);
      ctx.fillStyle = '#6b7280';
      ctx.font = `${W * 0.08}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', W / 2, H / 2);
      return;
    }

    const bg = new Image();
    bg.crossOrigin = 'anonymous';
    bg.onload = () => {
      ctx.drawImage(bg, 0, 0, W, H);

      // Posição do QR no canvas proporcional
      const qrX = W * (template as any).qrXPct;
      const qrY = H * (template as any).qrYPct;
      const qrSz = W * (template as any).qrSizePct;

      // Fundo branco do QR
      if (!(template as any).transparent) {
        const pad = qrSz * 0.04;
        const r = 4;
        if ((template as any).chocolateBorder) {
          // borda externa chocolate
          const borderW = qrSz * 0.08;
          ctx.fillStyle = '#5c2e00';
          // @ts-ignore
          ctx.roundRect(qrX - pad - borderW, qrY - pad - borderW, qrSz + (pad + borderW) * 2, qrSz + (pad + borderW) * 2, r + 3);
          ctx.fill();
          // segunda camada mais clara
          ctx.fillStyle = '#8b4513';
          // @ts-ignore
          ctx.roundRect(qrX - pad - borderW * 0.5, qrY - pad - borderW * 0.5, qrSz + (pad + borderW * 0.5) * 2, qrSz + (pad + borderW * 0.5) * 2, r + 1);
          ctx.fill();
        }
        // fundo branco do QR
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(qrX - pad, qrY - pad, qrSz + pad * 2, qrSz + pad * 2, r);
        ctx.fill();
      }

      // Gera QR simples via módulos manualmente (sem lib no client) — ou usa img
      // Usamos a API do qrserver pra preview leve
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      const url = pageUrl || 'https://mycupid.com.br';
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrX, qrY, qrSz, qrSz);
      };
      // Usa cor vermelha no QR do preview
      const color = template.qrColor.replace('#', '');
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=${color}&bgcolor=ffffff&margin=2`;
    };
    bg.src = template.preview;
  }, [template, pageUrl]);

  return <canvas ref={canvasRef} width={160} height={229} style={{ display: 'block', width: '100%', height: '100%', borderRadius: 8 }} />;
}

export default function QrCodeSelector({ value, onChange, onPriceChange }: Props) {
  const [selected, setSelected] = useState(value || 'classic');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelect = (opt: typeof QR_OPTIONS[0]) => {
    setSelected(opt.id);
    onChange(opt.id);
    onPriceChange(opt.price);
  };

  useEffect(() => {
    const opt = QR_OPTIONS.find(o => o.id === selected);
    if (opt) onPriceChange(opt.price);
  }, []);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-foreground">✨ QR Code Personalizado</span>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">Destaque</span>
      </div>

      {/* Carrossel horizontal */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {QR_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt)}
              className={cn(
                'relative flex-shrink-0 snap-start cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200',
                'flex flex-col bg-card/50',
                isSelected ? 'border-primary shadow-lg shadow-primary/20 scale-[1.03]' : 'border-border hover:border-primary/50'
              )}
              style={{ width: 130 }}
            >
              {/* Preview portrait */}
              <div className="relative overflow-hidden bg-muted/20" style={{ width: 130, height: 186 }}>
                {opt.preview ? (
                  <TemplatePreview template={opt as any} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white">
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=preview&margin=2`}
                        alt="QR"
                        width={90}
                        height={90}
                      />
                    </div>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-2 py-2 bg-card/80 border-t border-border">
                <p className="text-[10px] text-muted-foreground truncate mb-1">{opt.title}</p>
                <div className={cn(
                  'w-full py-1 rounded-lg font-bold text-xs text-center',
                  opt.price === 0
                    ? 'bg-muted text-muted-foreground'
                    : isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/20 text-primary'
                )}>
                  {opt.price === 0 ? 'GRÁTIS' : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Deslize para ver mais opções →</p>
    </div>
  );
}
