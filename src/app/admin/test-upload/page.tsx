import Link from 'next/link';
import { ArrowLeft, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TestUploadClient from './TestUploadClient';

export const dynamic = 'force-dynamic';

export default function TestUploadPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: '#09090b' }}>
      <header className="sticky top-0 z-50 border-b" style={{
        background: 'rgba(9,9,11,0.92)',
        borderColor: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
      }}>
        <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 px-2 shrink-0">
              <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.18)' }}>
              <TestTube2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white tracking-tight truncate">Test Upload</h1>
              <p className="text-[10px] text-zinc-500 leading-tight hidden sm:block">Simula upload + finalize pra capturar onde quebra</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6 max-w-3xl">
        <TestUploadClient />
      </main>
    </div>
  );
}
