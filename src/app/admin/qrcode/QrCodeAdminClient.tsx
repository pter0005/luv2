'use client';

import { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { downloadQrCard } from '@/lib/downloadQrCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Link as LinkIcon, AlertTriangle, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Template = { id: string; title: string; preview: string | null };

const TEMPLATES: Template[] = [
  { id: 'classic', title: 'Clássico (só QR)', preview: null },
  { id: 'juntos', title: 'Juntos para Sempre', preview: '/qr-templates/juntos-sempre.png' },
  { id: 'gato', title: 'Te Amo Gatinho', preview: '/qr-templates/gato-te-amo.png' },
  { id: 'surpresa', title: 'Surpresa Pra Você', preview: '/qr-templates/surpresa-pra-voce.png' },
  { id: 'qrcode-coelho', title: 'Feliz Páscoa', preview: '/qr-templates/qrcode-coelho .png' },
];

function extractPageId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  // Accept full URLs like https://mycupid.com.br/p/XYZ or just the pageId
  const match = trimmed.match(/\/p\/([^/?#]+)/);
  return match ? match[1] : trimmed;
}

async function downloadClassicQr(pageId: string) {
  const pageUrl = `https://mycupid.com.br/p/${pageId}`;
  const dataUrl = await QRCode.toDataURL(pageUrl, {
    width: 1000,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
  const link = document.createElement('a');
  link.download = `mycupid-qrcode-${pageId}.png`;
  link.href = dataUrl;
  link.click();
}

export default function QrCodeAdminClient() {
  const [rawInput, setRawInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pageId = useMemo(() => extractPageId(rawInput), [rawInput]);
  const pageUrl = pageId ? `https://mycupid.com.br/p/${pageId}` : '';

  const handleDownload = async () => {
    setError(null);
    if (!pageId) {
      setError('Cole um pageId ou URL da página.');
      return;
    }
    setIsDownloading(true);
    try {
      if (selectedTemplate === 'classic') {
        await downloadClassicQr(pageId);
      } else {
        await downloadQrCard(pageId, selectedTemplate, `mycupid-qrcode-${pageId}.png`);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao gerar QR Code.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Input card */}
      <div className="rounded-2xl p-4 sm:p-5 space-y-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <LinkIcon className="w-3.5 h-3.5" />
          Page ID ou URL
        </label>
        <Input
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Cole o pageId ou a URL completa (https://mycupid.com.br/p/...)"
          className="bg-zinc-900/70 border-zinc-800 text-white placeholder:text-zinc-600"
        />
        {pageUrl && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="truncate flex-1">{pageUrl}</span>
            <button
              onClick={handleCopyUrl}
              className="shrink-0 p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              type="button"
              aria-label="Copiar URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Template picker */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          Template do card
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => {
            const isSelected = selectedTemplate === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={cn(
                  'relative rounded-xl overflow-hidden border-2 transition-all text-left',
                  isSelected ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-white/10 hover:border-white/30',
                )}
              >
                <div className="relative aspect-[7/10] bg-zinc-900">
                  {t.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.preview} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white">
                      <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-200">
                        <div className="grid grid-cols-5 gap-0.5">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className={cn('w-1.5 h-1.5', i % 2 === 0 ? 'bg-black' : 'bg-transparent')} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-2 bg-black/60 border-t border-white/10">
                  <p className="text-[11px] font-semibold text-white truncate">{t.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action */}
      <div className="sticky bottom-4">
        <Button
          onClick={handleDownload}
          disabled={!pageId || isDownloading}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold"
        >
          {isDownloading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
          ) : (
            <><Download className="w-4 h-4 mr-2" /> Baixar QR Code</>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl p-3 flex items-start gap-2.5 text-sm text-red-300"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
