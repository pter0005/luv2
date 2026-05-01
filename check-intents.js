/**
 * check-intents.js
 *
 * Investiga os intents que apareceram no widget de erros como
 * "Página criada com N arquivos faltando".
 *
 * USO:
 *   node check-intents.js
 *
 * Pega FIREBASE_* do mesmo .env que o app já usa. Se rodar fora do diretório
 * do projeto, exporte FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e
 * FIREBASE_PRIVATE_KEY antes.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();

// Os 6 intents do widget
const INTENT_IDS = [
  '9GfVdYP7LLx1Ty85gubE',
  'cFASeiAm9BIFt30dYEfl',
  'ygDlXBiJOsuWWOK1pggb',
  '7O6eoWhAvEo5zE659Io2',
  'hi2tmQnNI3P0KpC35724',
  'MF0nHc4s3igsBSopZOIp',
];

const fmt = (ts) => {
  if (!ts) return 'null';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
};

const collectFiles = (v, out = []) => {
  if (Array.isArray(v)) { v.forEach(it => collectFiles(it, out)); return out; }
  if (v && typeof v === 'object') {
    if (typeof v.path === 'string') out.push({ path: v.path, url: v.url });
    for (const k in v) if (k !== 'path' && k !== 'url') collectFiles(v[k], out);
  }
  return out;
};

(async () => {
  console.log(`\nProjeto: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`Bucket: ${bucket.name}\n`);
  console.log('═'.repeat(80));

  for (const intentId of INTENT_IDS) {
    console.log(`\nINTENT: ${intentId}`);
    console.log('─'.repeat(80));

    const snap = await db.collection('payment_intents').doc(intentId).get();
    if (!snap.exists) {
      console.log('  ❌ Doc não existe (foi deletado? id errado?)');
      continue;
    }
    const d = snap.data();

    // Datas chave
    console.log(`  createdAt:     ${fmt(d.createdAt)}`);
    console.log(`  updatedAt:     ${fmt(d.updatedAt)}`);
    console.log(`  status:        ${d.status}`);
    console.log(`  paidAmount:    ${d.paidAmount ?? '—'}`);
    console.log(`  plan:          ${d.plan}`);
    console.log(`  lovePageId:    ${d.lovePageId || '—'}`);
    console.log(`  email:         ${d.guestEmail || d.userEmail || '—'}`);
    console.log(`  userId:        ${d.userId || '—'}`);
    console.log(`  _finalizeAttempts: ${d._finalizeAttempts ?? 0}`);

    // Calcula o gap entre createdAt e a hora atual / lovepage criado
    if (d.createdAt && d.lovePageId) {
      const lp = await db.collection('lovepages').doc(d.lovePageId).get();
      if (lp.exists) {
        const lpData = lp.data();
        const createdMs = d.createdAt.toMillis();
        const finalizedMs = lpData.createdAt?.toMillis?.() ?? lpData.filesMovedAt?.toMillis?.();
        if (finalizedMs) {
          const gapMin = Math.round((finalizedMs - createdMs) / 60000);
          console.log(`  GAP intent→finalize: ${gapMin} min`);
        }
      }
    }

    // Coleta todos os paths esperados
    const expected = [
      ...collectFiles(d.galleryImages),
      ...collectFiles(d.timelineEvents),
      ...collectFiles(d.memoryGameImages),
      ...collectFiles(d.puzzleImage),
      ...collectFiles(d.audioRecording),
      ...collectFiles(d.backgroundVideo),
    ].filter(f => f.path);

    console.log(`  Arquivos esperados: ${expected.length}`);

    // Checa cada um no Storage (o que falta = stripado)
    let tempExist = 0, tempMissing = 0, lovepageExist = 0;
    const sample = [];
    for (const f of expected) {
      try {
        const [exists] = await bucket.file(f.path).exists();
        if (f.path.startsWith('temp/')) {
          if (exists) tempExist++; else tempMissing++;
        } else if (f.path.startsWith('lovepages/')) {
          if (exists) lovepageExist++;
        }
        if (sample.length < 3) sample.push(`    ${exists ? '✓' : '✗'} ${f.path}`);
      } catch (e) {
        sample.push(`    ? ${f.path} (${e.message})`);
      }
    }
    console.log(`  No Storage: ${tempExist} em temp/ visíveis · ${tempMissing} em temp/ MISSING · ${lovepageExist} em lovepages/`);
    if (sample.length) console.log(sample.join('\n'));

    // Procura entries em failed_file_moves desse intent
    if (d.lovePageId) {
      const fmSnap = await db.collection('failed_file_moves')
        .where('pageId', '==', d.lovePageId).limit(50).get();
      if (!fmSnap.empty) {
        console.log(`  failed_file_moves: ${fmSnap.size} entries`);
        const errs = {};
        fmSnap.docs.forEach(doc => {
          const e = doc.data().error || 'unknown';
          const key = e.includes('source_missing') ? 'source_missing'
            : e.includes('429') || e.includes('rate') ? 'rate_limit'
            : e.includes('timeout') ? 'timeout'
            : e;
          errs[key] = (errs[key] || 0) + 1;
        });
        console.log(`    ${Object.entries(errs).map(([k,v])=>`${k}(${v})`).join(', ')}`);
      } else {
        console.log(`  failed_file_moves: nenhum (arquivos sumiram ANTES do moveFile tentar)`);
      }
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('LEITURA DOS DADOS:');
  console.log('  • GAP curto (<5min)  + temp/ MISSING + sem failed_file_moves → eventual consistency / pre-flight curto');
  console.log('  • GAP longo (>1h)    + temp/ MISSING + sem failed_file_moves → lifecycle do bucket deletou');
  console.log('  • GAP qualquer       + failed_file_moves com source_missing  → arquivo sumiu durante move (race com lifecycle)');
  console.log('  • GAP qualquer       + failed_file_moves com rate_limit/429  → muitos arquivos paralelos, problema de quota');
  console.log('═'.repeat(80) + '\n');

  process.exit(0);
})().catch(err => {
  console.error('ERRO:', err);
  process.exit(1);
});
