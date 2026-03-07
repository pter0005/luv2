/**
 * check-failed-moves.js
 * 
 * Script de monitoramento para a coleção `failed_file_moves` no Firestore.
 * Roda como um job periódico (ex: diariamente via cron ou GitHub Actions).
 * 
 * O que faz:
 * 1. Busca todos os documentos com resolved: false
 * 2. Tenta re-executar o moveFile para recuperar os arquivos
 * 3. Loga o resultado e envia alerta por email se houver falhas
 * 
 * USO:
 *   node check-failed-moves.js
 * 
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *   ALERT_EMAIL (email para receber alertas)
 *   RESEND_API_KEY (opcional — se quiser alertas por email)
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

// ── INIT FIREBASE ADMIN ───────────────────────────────────────────
initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
});

const db = getFirestore();
const bucket = getStorage().bucket();

// ── TENTAR RE-MOVER UM ARQUIVO ────────────────────────────────────
async function retryFileMove(doc) {
    const { oldPath, newPath, pageId } = doc.data();
    
    console.log(`[RETRY] ${oldPath} → ${newPath}`);
    
    try {
        // Verifica se o arquivo ainda existe no destino (já foi movido antes)
        const destFile = bucket.file(newPath);
        const [destExists] = await destFile.exists();
        if (destExists) {
            console.log(`  ✅ Arquivo já existe no destino. Marcando como resolvido.`);
            await doc.ref.update({ resolved: true, resolvedAt: Timestamp.now(), resolution: 'already_at_destination' });
            return { success: true, reason: 'already_at_destination' };
        }

        // Verifica se o arquivo ainda existe na origem (temp/)
        const srcFile = bucket.file(oldPath);
        const [srcExists] = await srcFile.exists();
        if (!srcExists) {
            console.log(`  ⚠️  Arquivo não existe mais na origem. Marcando como perdido.`);
            await doc.ref.update({ resolved: true, resolvedAt: Timestamp.now(), resolution: 'source_not_found' });
            
            // Atualiza a lovepage para remover a referência quebrada (opcional)
            // await fixBrokenReference(pageId, oldPath);
            
            return { success: false, reason: 'source_not_found' };
        }

        // Tenta mover
        await srcFile.move(newPath);
        await destFile.makePublic();

        // Atualiza a URL no documento da lovepage
        const newUrl = destFile.publicUrl();
        await updateLovePageUrl(pageId, oldPath, newPath, newUrl);

        // Marca como resolvido
        await doc.ref.update({ resolved: true, resolvedAt: Timestamp.now(), resolution: 'moved_successfully', newUrl });
        console.log(`  ✅ Movido com sucesso! Nova URL: ${newUrl}`);
        return { success: true, reason: 'moved_successfully' };

    } catch (error) {
        console.error(`  ❌ Falha ao reprocessar:`, error.message);
        await doc.ref.update({ lastRetryAt: Timestamp.now(), lastRetryError: error.message });
        return { success: false, reason: error.message };
    }
}

// ── ATUALIZAR URL NA LOVEPAGE ─────────────────────────────────────
async function updateLovePageUrl(pageId, oldPath, newPath, newUrl) {
    try {
        const pageRef = db.collection('lovepages').doc(pageId);
        const pageSnap = await pageRef.get();
        if (!pageSnap.exists) return;

        const pageData = pageSnap.data();
        const updates = {};

        // Verifica galeria
        if (pageData.galleryImages?.length) {
            const updated = pageData.galleryImages.map(img => 
                img.path === oldPath ? { url: newUrl, path: newPath } : img
            );
            if (JSON.stringify(updated) !== JSON.stringify(pageData.galleryImages)) {
                updates.galleryImages = updated;
            }
        }

        // Verifica timeline
        if (pageData.timelineEvents?.length) {
            const updated = pageData.timelineEvents.map(ev => {
                if (ev.image?.path === oldPath) {
                    return { ...ev, image: { url: newUrl, path: newPath } };
                }
                return ev;
            });
            if (JSON.stringify(updated) !== JSON.stringify(pageData.timelineEvents)) {
                updates.timelineEvents = updated;
            }
        }

        // Verifica puzzle
        if (pageData.puzzleImage?.path === oldPath) {
            updates.puzzleImage = { url: newUrl, path: newPath };
        }

        // Verifica áudio
        if (pageData.audioRecording?.path === oldPath) {
            updates.audioRecording = { url: newUrl, path: newPath };
        }

        // Verifica jogo da memória
        if (pageData.memoryGameImages?.length) {
            const updated = pageData.memoryGameImages.map(img =>
                img.path === oldPath ? { url: newUrl, path: newPath } : img
            );
            if (JSON.stringify(updated) !== JSON.stringify(pageData.memoryGameImages)) {
                updates.memoryGameImages = updated;
            }
        }

        if (Object.keys(updates).length > 0) {
            await pageRef.update(updates);
            console.log(`  📝 URL atualizada na lovepage ${pageId}`);
        }
    } catch (error) {
        console.error(`  ⚠️  Erro ao atualizar lovepage ${pageId}:`, error.message);
    }
}

// ── ENVIAR ALERTA POR EMAIL (via Resend) ──────────────────────────
async function sendAlertEmail(report) {
    const apiKey = process.env.RESEND_API_KEY;
    const alertEmail = process.env.ALERT_EMAIL;
    
    if (!apiKey || !alertEmail) {
        console.log('⚠️  RESEND_API_KEY ou ALERT_EMAIL não configurados. Pulando email.');
        return;
    }

    const { total, resolved, failed, lost } = report;

    const emailBody = `
<h2>📋 Relatório de Arquivos Não Movidos — MyCupid</h2>
<p>Data: ${new Date().toLocaleString('pt-BR')}</p>

<h3>Resumo</h3>
<ul>
  <li>Total de arquivos pendentes: <strong>${total}</strong></li>
  <li>✅ Recuperados com sucesso: <strong>${resolved}</strong></li>
  <li>❌ Falha ao recuperar: <strong>${failed}</strong></li>
  <li>💀 Origem não encontrada (perdidos): <strong>${lost}</strong></li>
</ul>

${lost > 0 ? '<p style="color:red;font-weight:bold;">⚠️ Existem arquivos perdidos que precisam de atenção manual.</p>' : ''}
${failed > 0 ? '<p style="color:orange;">⚠️ Alguns arquivos falharam novamente. Verifique os logs.</p>' : ''}
${total === 0 ? '<p style="color:green;">✅ Nenhum arquivo pendente. Tudo certo!</p>' : ''}
    `;

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'noreply@mycupid.com.br',
                to: alertEmail,
                subject: `[MyCupid] ${total === 0 ? '✅ OK' : `⚠️ ${total} arquivo(s) pendente(s)`} — Relatório Diário`,
                html: emailBody,
            }),
        });
        
        if (res.ok) {
            console.log(`📧 Email de alerta enviado para ${alertEmail}`);
        } else {
            const err = await res.text();
            console.error(`❌ Falha ao enviar email:`, err);
        }
    } catch (error) {
        console.error(`❌ Erro ao conectar com Resend:`, error.message);
    }
}

// ── MAIN ──────────────────────────────────────────────────────────
async function main() {
    console.log('🔍 Verificando failed_file_moves...\n');

    const snapshot = await db.collection('failed_file_moves')
        .where('resolved', '==', false)
        .get();

    const total = snapshot.size;
    
    if (total === 0) {
        console.log('✅ Nenhum arquivo pendente. Tudo certo!');
        await sendAlertEmail({ total: 0, resolved: 0, failed: 0, lost: 0 });
        return;
    }

    console.log(`⚠️  ${total} arquivo(s) pendente(s) encontrado(s). Tentando recuperar...\n`);

    let resolved = 0;
    let failed = 0;
    let lost = 0;

    for (const doc of snapshot.docs) {
        const result = await retryFileMove(doc);
        if (result.success) {
            resolved++;
        } else if (result.reason === 'source_not_found') {
            lost++;
        } else {
            failed++;
        }
    }

    console.log('\n── RELATÓRIO FINAL ──────────────────────────────────');
    console.log(`Total:     ${total}`);
    console.log(`Resolvidos: ${resolved}`);
    console.log(`Falhas:    ${failed}`);
    console.log(`Perdidos:  ${lost}`);
    console.log('─────────────────────────────────────────────────────\n');

    await sendAlertEmail({ total, resolved, failed, lost });

    if (lost > 0 || failed > 0) {
        process.exit(1); // Sai com erro para que o CI/CD saiba que houve problema
    }
}

main().catch(err => {
    console.error('ERRO FATAL:', err);
    process.exit(1);
});
