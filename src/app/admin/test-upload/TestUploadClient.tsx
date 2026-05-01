'use client';

import { useState, useRef } from 'react';
import { Upload, Check, X, Loader2, Copy, Image as ImageIcon, Play, Trash2, FileText } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { compressImage } from '@/lib/image-utils';

type StepStatus = 'pending' | 'running' | 'ok' | 'fail' | 'skip';
type Step = {
  id: string;
  label: string;
  status: StepStatus;
  ms?: number;
  detail?: string;
  error?: string;
};

type TestRun = {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  startedAt: number;
  steps: Step[];
  finalPath?: string;
  finalUrl?: string;
  totalMs?: number;
  done: boolean;
  errored: boolean;
};

const FOLDERS = ['gallery', 'timeline', 'memory-game', 'puzzle', 'audio'] as const;

export default function TestUploadClient() {
  const { user, storage, auth, isUserLoading } = useFirebase();
  const [folder, setFolder] = useState<typeof FOLDERS[number]>('gallery');
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [running, setRunning] = useState(false);
  const [finalizeRun, setFinalizeRun] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const updateStep = (runId: string, stepId: string, patch: Partial<Step>) => {
    setRuns(prev => prev.map(r => r.id === runId
      ? { ...r, steps: r.steps.map(s => s.id === stepId ? { ...s, ...patch } : s) }
      : r));
  };
  const finishRun = (runId: string, errored: boolean, finalPath?: string, finalUrl?: string) => {
    setRuns(prev => prev.map(r => r.id === runId
      ? { ...r, done: true, errored, finalPath, finalUrl, totalMs: Date.now() - r.startedAt }
      : r));
  };

  const handleFiles = async (files: File[]) => {
    if (running) return;
    if (files.length === 0) return;
    if (isUserLoading) {
      alert('Aguarde — Firebase ainda inicializando.');
      return;
    }

    setRunning(true);
    setFinalizeRun(null);

    // Garante user (anônimo se preciso)
    let activeUser = user;
    if (!activeUser && auth) {
      try {
        const cred = await signInAnonymously(auth);
        activeUser = cred.user;
      } catch (e: any) {
        alert(`Auth anônima falhou: ${e?.message}`);
        setRunning(false);
        return;
      }
    }
    if (!activeUser) { setRunning(false); return; }

    const newRuns: TestRun[] = files.map(f => ({
      id: crypto.randomUUID(),
      fileName: f.name,
      fileSize: f.size,
      fileType: f.type,
      startedAt: Date.now(),
      steps: [
        { id: 'compress', label: '1. Compressão de imagem', status: 'pending' },
        { id: 'token', label: '2. Pegar idToken do Firebase Auth', status: 'pending' },
        { id: 'server-upload', label: '3. POST /api/upload-image (server)', status: 'pending' },
        { id: 'head-check', label: '4. HEAD na URL pública (cliente vê o byte?)', status: 'pending' },
        { id: 'storage-exists', label: '5. bucket.file().exists() (server vê o byte?)', status: 'pending' },
      ],
      done: false,
      errored: false,
    }));
    setRuns(prev => [...newRuns, ...prev]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const run = newRuns[i];
      let gotPath = '';
      let gotUrl = '';

      // STEP 1: Compress
      let processedFile: File | Blob = file;
      try {
        updateStep(run.id, 'compress', { status: 'running' });
        const t0 = Date.now();
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file, 1280, 0.85);
        }
        const sz = (processedFile as any).size;
        updateStep(run.id, 'compress', {
          status: 'ok', ms: Date.now() - t0,
          detail: file.type.startsWith('image/')
            ? `${(file.size/1024).toFixed(0)}KB → ${(sz/1024).toFixed(0)}KB`
            : 'pulado (não é imagem)',
        });
      } catch (e: any) {
        updateStep(run.id, 'compress', { status: 'fail', error: e?.message });
        finishRun(run.id, true);
        continue;
      }

      // STEP 2: Pegar idToken
      let idToken = '';
      try {
        updateStep(run.id, 'token', { status: 'running' });
        const t0 = Date.now();
        idToken = await activeUser.getIdToken();
        updateStep(run.id, 'token', {
          status: 'ok', ms: Date.now() - t0,
          detail: `uid=${activeUser.uid.slice(0,12)}… (${activeUser.isAnonymous ? 'anon' : 'logado'})`,
        });
      } catch (e: any) {
        updateStep(run.id, 'token', { status: 'fail', error: e?.message });
        finishRun(run.id, true);
        continue;
      }

      // STEP 3: POST /api/upload-image
      try {
        updateStep(run.id, 'server-upload', { status: 'running' });
        const t0 = Date.now();
        const fd = new FormData();
        fd.append('file', processedFile, file.name);
        fd.append('folder', folder);
        fd.append('idToken', idToken);
        const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          updateStep(run.id, 'server-upload', {
            status: 'fail',
            ms: Date.now() - t0,
            error: `HTTP ${res.status}: ${data?.error || 'unknown'} ${data?.message ? `(${data.message})` : ''}`,
          });
          finishRun(run.id, true);
          continue;
        }
        gotPath = data.path;
        gotUrl = data.url;
        updateStep(run.id, 'server-upload', {
          status: 'ok', ms: Date.now() - t0,
          detail: `path=${data.path.split('/').pop()} (${data.size} bytes)`,
        });
      } catch (e: any) {
        updateStep(run.id, 'server-upload', { status: 'fail', error: e?.message });
        finishRun(run.id, true);
        continue;
      }

      // STEP 4: GET na URL pública (testa se cliente final consegue carregar)
      // Usa GET com no-cors pra evitar erro de CORS no preflight — só
      // queremos saber se o response chega, não ler o body.
      try {
        updateStep(run.id, 'head-check', { status: 'running' });
        const t0 = Date.now();
        let visible = false;
        let lastStatus = 0;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            // mode: 'no-cors' evita preflight; cliente real (img tag, video tag)
            // também não precisa de CORS — só fetch JS precisa.
            const r = await fetch(gotUrl, { mode: 'no-cors', cache: 'no-store' });
            lastStatus = r.status || 200; // opaque response = status 0 mas chegou
            // Em mode:'no-cors' a response é "opaque" (status 0) mas se não jogou
            // erro, é porque o servidor respondeu. Falha de rede joga exception.
            visible = true;
            break;
          } catch { /* retenta */ }
          if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
        }
        if (!visible) {
          updateStep(run.id, 'head-check', {
            status: 'fail', ms: Date.now() - t0,
            error: `URL pública não respondeu após 3 tries`,
          });
        } else {
          updateStep(run.id, 'head-check', {
            status: 'ok', ms: Date.now() - t0,
            detail: 'URL pública acessível (img/video tag carregaria normalmente)',
          });
        }
      } catch (e: any) {
        updateStep(run.id, 'head-check', { status: 'fail', error: e?.message });
      }

      // STEP 5: Storage exists check (via API admin de teste)
      try {
        updateStep(run.id, 'storage-exists', { status: 'running' });
        const t0 = Date.now();
        const r = await fetch('/api/test-storage-exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: gotPath }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          updateStep(run.id, 'storage-exists', {
            status: 'fail', ms: Date.now() - t0,
            error: `HTTP ${r.status}: ${data?.error}`,
          });
        } else {
          updateStep(run.id, 'storage-exists', {
            status: data.exists ? 'ok' : 'fail',
            ms: Date.now() - t0,
            detail: data.exists ? `size=${data.size} bytes` : 'NÃO EXISTE no Admin SDK',
          });
        }
      } catch (e: any) {
        updateStep(run.id, 'storage-exists', { status: 'fail', error: e?.message });
      }

      const finalRun = newRuns[i];
      const allOk = !finalRun; // será recalculado abaixo via state
      finishRun(run.id, false, gotPath, gotUrl);
    }

    setRunning(false);
  };

  const runFinalizeTest = async () => {
    const successPaths = runs.filter(r => r.done && !r.errored && r.finalPath).map(r => r.finalPath!);
    if (successPaths.length === 0) {
      alert('Nenhum upload bem-sucedido pra testar finalize.');
      return;
    }
    setFinalizeRun({ status: 'running' });
    try {
      const res = await fetch('/api/test-upload-finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: successPaths }),
      });
      const data = await res.json();
      setFinalizeRun({ status: res.ok ? 'done' : 'fail', data });
    } catch (e: any) {
      setFinalizeRun({ status: 'fail', error: e?.message });
    }
  };

  const clearAll = () => {
    setRuns([]);
    setFinalizeRun(null);
  };

  const buildReport = (): string => {
    const lines: string[] = [];
    lines.push('# Relatório de Teste de Upload — MyCupid');
    lines.push('');
    lines.push(`**Gerado em:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    lines.push(`**Folder testada:** \`${folder}\``);
    lines.push(`**Arquivos testados:** ${runs.length}`);
    lines.push(`**Sucesso:** ${runs.filter(r => r.done && !r.errored).length}`);
    lines.push(`**Falha:** ${runs.filter(r => r.done && r.errored).length}`);
    lines.push('');
    lines.push('## Contexto');
    lines.push('Pipeline testado: cliente → compressão → idToken → POST /api/upload-image (Admin SDK upload) → HEAD na URL pública → bucket.file().exists() server-side.');
    lines.push('');
    lines.push('Quando todos os passos passam, o upload está sólido. Falha em qualquer passo revela onde o pipeline real (em produção, com clientes pagantes) tá perdendo arquivos.');
    lines.push('');

    runs.forEach((r, i) => {
      lines.push(`## ${i + 1}. ${r.fileName} (${(r.fileSize/1024).toFixed(0)} KB · ${r.fileType})`);
      lines.push('');
      lines.push(`**Status final:** ${r.errored ? '❌ ERRO' : r.done ? '✅ OK' : '⏳ pending'}`);
      if (r.totalMs) lines.push(`**Total:** ${r.totalMs} ms`);
      if (r.finalPath) lines.push(`**Path:** \`${r.finalPath}\``);
      lines.push('');
      lines.push('| Step | Status | Tempo | Detalhe / Erro |');
      lines.push('|---|---|---|---|');
      r.steps.forEach(s => {
        const st = s.status === 'ok' ? '✅' : s.status === 'fail' ? '❌' : s.status === 'running' ? '⏳' : '·';
        const ms = s.ms != null ? `${s.ms}ms` : '—';
        const det = s.error ? `**ERROR:** ${s.error}` : (s.detail || '—');
        lines.push(`| ${s.label} | ${st} | ${ms} | ${det} |`);
      });
      lines.push('');
    });

    if (finalizeRun?.data?.results) {
      lines.push('## Teste de Finalize (move temp → lovepages)');
      lines.push('');
      finalizeRun.data.results.forEach((r: any, idx: number) => {
        lines.push(`### ${idx + 1}. \`${r.sourcePath.split('/').pop()}\` — ${r.finalStatus}`);
        lines.push('');
        lines.push('| Step | OK | ms | Detalhe |');
        lines.push('|---|---|---|---|');
        r.steps.forEach((s: any) => {
          lines.push(`| ${s.step} | ${s.ok ? '✅' : '❌'} | ${s.ms}ms | ${JSON.stringify(s.value || s.error || '')} |`);
        });
        lines.push('');
      });
    }

    lines.push('## Pedido');
    lines.push('Identificar:');
    lines.push('1. Em qual etapa o upload tá quebrando (se quebrou).');
    lines.push('2. Causa raiz baseada na mensagem de erro.');
    lines.push('3. Fix cirúrgico no código com path:linha.');
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = buildReport();
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {}
      document.body.removeChild(ta);
    }
  };

  const successCount = runs.filter(r => r.done && !r.errored).length;
  const failCount = runs.filter(r => r.done && r.errored).length;

  return (
    <div className="space-y-4">
      {/* Picker de folder */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Pasta destino</p>
        <div className="flex flex-wrap gap-1.5">
          {FOLDERS.map(f => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              disabled={running}
              className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition ${
                folder === f
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.07] hover:text-white'
              } disabled:opacity-40`}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Botão upload */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={running}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-sm transition disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(20,184,166,0.10))',
            border: '1px solid rgba(34,197,94,0.40)',
            color: '#86efac',
          }}
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {running ? 'Testando...' : 'Selecionar arquivos pra testar'}
        </button>
        {runs.length > 0 && (
          <>
            <button
              onClick={runFinalizeTest}
              disabled={running || successCount === 0}
              className="px-3 py-3 rounded-xl text-[12px] font-bold transition disabled:opacity-40"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#d8b4fe' }}
            >
              <Play className="w-3.5 h-3.5 inline mr-1.5" />
              Testar finalize ({successCount})
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-3 rounded-xl text-[12px] font-bold transition"
              style={{
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.15)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(168,85,247,0.4)'}`,
                color: copied ? '#86efac' : '#d8b4fe',
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5 inline mr-1.5" /> : <Copy className="w-3.5 h-3.5 inline mr-1.5" />}
              {copied ? 'Copiado!' : 'Copiar relatório'}
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-3 rounded-xl text-[12px] font-bold text-zinc-400 hover:text-red-300 hover:bg-red-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5 inline" />
            </button>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const fs = e.target.files ? Array.from(e.target.files) : [];
          if (fs.length > 0) handleFiles(fs);
          e.target.value = '';
        }}
      />

      {/* Sumário */}
      {runs.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label="Testes" value={runs.length} color="#a855f7" />
          <SummaryCard label="OK" value={successCount} color="#22c55e" />
          <SummaryCard label="Falha" value={failCount} color="#ef4444" />
        </div>
      )}

      {/* Lista de runs */}
      {runs.length === 0 && (
        <div className="rounded-xl py-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)' }}>
          <ImageIcon className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
          <p className="text-[12px] text-zinc-500">Selecione fotos/vídeos/áudio pra simular o upload.</p>
          <p className="text-[10.5px] text-zinc-600 mt-1">A página vai mostrar passo a passo o que aconteceu.</p>
        </div>
      )}

      <div className="space-y-3">
        {runs.map(run => <RunCard key={run.id} run={run} />)}
      </div>

      {/* Resultado finalize */}
      {finalizeRun && (
        <div className="rounded-xl p-4 mt-4" style={{
          background: finalizeRun.status === 'fail' ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
          border: `1px solid ${finalizeRun.status === 'fail' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: finalizeRun.status === 'fail' ? '#fca5a5' : '#86efac' }}>
            <FileText className="w-3 h-3 inline mr-1.5" />
            Teste de Finalize (move temp → lovepages)
          </p>
          {finalizeRun.status === 'running' ? (
            <p className="text-[12px] text-zinc-400"><Loader2 className="w-3 h-3 inline animate-spin mr-2" />Testando...</p>
          ) : finalizeRun.error ? (
            <p className="text-[12px] text-red-200 font-mono">{finalizeRun.error}</p>
          ) : (
            <div className="space-y-2">
              {finalizeRun.data?.results?.map((r: any, i: number) => (
                <div key={i} className="text-[11px] font-mono">
                  <span className={r.finalStatus === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                    {r.finalStatus === 'success' ? '✓' : '✗'}
                  </span>{' '}
                  <span className="text-zinc-400">{r.sourcePath.split('/').pop()}</span>{' '}
                  <span className="text-zinc-600">— {r.finalStatus} ({r.totalMs}ms)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}25` }}>
      <p className="text-[9.5px] font-bold uppercase tracking-widest mb-1 opacity-70" style={{ color }}>{label}</p>
      <div className="text-xl font-black tabular-nums text-white">{value}</div>
    </div>
  );
}

function RunCard({ run }: { run: TestRun }) {
  const statusColor = run.errored ? '#ef4444' : run.done ? '#22c55e' : '#a855f7';
  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${statusColor}30`,
    }}>
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
        <ImageIcon className="w-4 h-4 shrink-0" style={{ color: statusColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-white truncate">{run.fileName}</p>
          <p className="text-[10px] text-zinc-500">
            {(run.fileSize/1024).toFixed(0)} KB · {run.fileType || 'unknown'}
            {run.totalMs && ` · ${run.totalMs}ms total`}
          </p>
        </div>
        {run.done && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{
            background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}50`,
          }}>{run.errored ? 'FALHOU' : 'OK'}</span>
        )}
        {!run.done && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
      </div>
      <div className="p-3 space-y-1.5">
        {run.steps.map(s => <StepRow key={s.id} step={s} />)}
      </div>
      {run.finalPath && (
        <div className="px-4 py-2 border-t border-white/5 text-[10px] font-mono text-zinc-500 truncate" title={run.finalPath}>
          {run.finalPath}
        </div>
      )}
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  const icon = step.status === 'ok' ? <Check className="w-3 h-3 text-emerald-400" />
    : step.status === 'fail' ? <X className="w-3 h-3 text-red-400" />
    : step.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
    : <span className="w-3 h-3 rounded-full bg-white/10 inline-block" />;

  return (
    <div className="flex items-start gap-2 px-2 py-1 rounded text-[11px]">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${step.status === 'fail' ? 'text-red-300' : step.status === 'ok' ? 'text-zinc-200' : 'text-zinc-500'}`}>
            {step.label}
          </span>
          {step.ms != null && <span className="text-[10px] text-zinc-600 tabular-nums">{step.ms}ms</span>}
        </div>
        {step.detail && <p className="text-[10.5px] text-zinc-500 mt-0.5">{step.detail}</p>}
        {step.error && <p className="text-[10.5px] text-red-400/90 font-mono mt-0.5 break-all">{step.error}</p>}
      </div>
    </div>
  );
}
