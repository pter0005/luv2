'use client';

import { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';

export default function CopyReportButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para browsers/contexts sem clipboard API
      const ta = document.createElement('textarea');
      ta.value = markdown;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2500); }
      catch { /* noop */ }
      document.body.removeChild(ta);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 h-9 rounded-lg text-[12px] font-bold transition shrink-0"
      style={{
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.15)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(168,85,247,0.4)'}`,
        color: copied ? '#86efac' : '#d8b4fe',
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? 'Copiado!' : 'Copiar relatório técnico'}</span>
      {!copied && <FileText className="w-3 h-3 opacity-60" />}
    </button>
  );
}
