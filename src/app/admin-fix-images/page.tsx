'use client';

import { useState, useRef } from 'react';

interface BatchResult {
  fixed: number;
  skipped: number;
  errors: number;
  processed: string;
  elapsed: string;
  fixedPages: string[];
  nextUrl: string | null;
  errorMessages: string[];
  dryRun?: boolean;
  fatal?: string;
}

export default function FixImagesPage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState('');
  const [totals, setTotals] = useState({ fixed: 0, errors: 0, skipped: 0 });
  const abortRef = useRef(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const run = async (dryRun: boolean) => {
    setRunning(true);
    setLogs([]);
    setTotals({ fixed: 0, errors: 0, skipped: 0 });
    abortRef.current = false;

    const mode = dryRun ? 'DRY RUN' : 'EXECUÇÃO REAL';
    addLog(`🚀 Iniciando ${mode}...`);

    let url: string | null = `/api/fix-images?offset=0${dryRun ? '&dry=1' : ''}`;
    let totalFixed = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    let batch = 1;

    while (url && !abortRef.current) {
      addLog(`📦 Lote ${batch}...`);

      try {
        const res = await fetch(url);
        const data: BatchResult = await res.json();

        if (data.fatal) {
          addLog(`❌ ERRO FATAL: ${data.fatal}`);
          break;
        }

        totalFixed += data.fixed;
        totalErrors += data.errors;
        totalSkipped += data.skipped || 0;
        setTotals({ fixed: totalFixed, errors: totalErrors, skipped: totalSkipped });
        setProgress(data.processed);

        addLog(
          `✅ Lote ${batch}: ${data.fixed} corrigidas, ${data.skipped || 0} ok, ${data.errors} erros (${data.elapsed})`
        );

        if (data.fixedPages?.length) {
          addLog(`   Páginas: ${data.fixedPages.join(', ')}`);
        }

        if (data.errorMessages?.length) {
          data.errorMessages.forEach((e) => addLog(`   ⚠️ ${e}`));
        }

        url = data.nextUrl;
        batch++;
      } catch (e: any) {
        addLog(`❌ Fetch falhou: ${e.message}`);
        break;
      }
    }

    if (abortRef.current) {
      addLog('⏹️ Parado pelo usuário.');
    } else {
      addLog(`🎉 PRONTO! ${totalFixed} páginas corrigidas, ${totalErrors} erros, ${totalSkipped} já estavam ok.`);
    }

    setRunning(false);
  };

  return (
    <div style={{
      maxWidth: 800,
      margin: '40px auto',
      padding: 24,
      fontFamily: 'monospace',
      background: '#1a1a2e',
      color: '#eee',
      borderRadius: 12,
      minHeight: '100vh',
    }}>
      <h1 style={{ color: '#a855f7', fontSize: 24, marginBottom: 8 }}>
        🔧 MyCupid — Fix Images
      </h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
        Corrige URLs de imagens quebradas no Firestore e move arquivos do temp/ para lovepages/
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => run(true)}
          disabled={running}
          style={{
            padding: '12px 24px',
            background: running ? '#333' : '#4a5568',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          🔍 Dry Run (simular)
        </button>

        <button
          onClick={() => run(false)}
          disabled={running}
          style={{
            padding: '12px 24px',
            background: running ? '#333' : '#a855f7',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          🚀 Executar pra valer
        </button>

        {running && (
          <button
            onClick={() => { abortRef.current = true; }}
            style={{
              padding: '12px 24px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            ⏹️ Parar
          </button>
        )}
      </div>

      {progress && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Progresso: {progress}</span>
            <span style={{ color: '#a855f7' }}>
              ✅ {totals.fixed} corrigidas | ⏭️ {totals.skipped} ok | ❌ {totals.errors} erros
            </span>
          </div>
          <div style={{ background: '#333', borderRadius: 4, height: 8 }}>
            <div
              style={{
                background: '#a855f7',
                height: '100%',
                borderRadius: 4,
                width: (() => {
                  const parts = progress.split('/');
                  if (parts.length < 2) return '0%';
                  const num = parseInt(parts[0]);
                  const den = parseInt(parts[1]);
                  if (isNaN(num) || isNaN(den) || den === 0) return '0%';
                  const pct = (num / den) * 100;
                  return `${pct}%`;
                })(),
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          background: '#0d0d1a',
          borderRadius: 8,
          padding: 16,
          height: 400,
          overflowY: 'auto',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {logs.length === 0 && (
          <span style={{ color: '#555' }}>
            Clica em "Dry Run" primeiro pra simular, depois "Executar pra valer" pra corrigir de verdade.
          </span>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{
            color: log.includes('❌') ? '#f87171'
              : log.includes('⚠️') ? '#fbbf24'
              : log.includes('🎉') ? '#34d399'
              : '#ccc',
          }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
