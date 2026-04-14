import Link from 'next/link';
import { ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QrCodeAdminClient from './QrCodeAdminClient';

export const dynamic = 'force-dynamic';

export default function QrCodeAdminPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: '#09090b' }}>
      <header className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(9,9,11,0.92)',
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
        }}>
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button asChild variant="ghost" size="sm"
              className="text-zinc-400 hover:text-white h-8 px-2 shrink-0">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.18)' }}>
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white tracking-tight truncate">QR Code das Páginas</h1>
              <p className="text-[10px] text-zinc-500 leading-tight hidden sm:block">Gere e baixe o QR de qualquer página</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6 max-w-2xl">
        <QrCodeAdminClient />
      </main>
    </div>
  );
}
