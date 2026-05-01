import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { isAdminRequest } from '@/lib/admin-guard';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Simula a parte do finalize que MOVE arquivos de temp/ pra lovepages/.
 * Recebe lista de paths em temp/, tenta mover pra um pageId fake (descartado).
 * Reporta passo a passo o que aconteceu pra cada arquivo.
 *
 * Admin-only (isAdminRequest).
 */
export async function POST(req: NextRequest) {
  const ok = await isAdminRequest();
  if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const paths: string[] = Array.isArray(body?.paths) ? body.paths : [];
    if (paths.length === 0) return NextResponse.json({ error: 'no_paths' }, { status: 400 });

    const bucket = getAdminStorage();
    const fakePageId = `test-${randomUUID().slice(0, 8)}`;

    const results = [];
    for (const sourcePath of paths) {
      const startedAt = Date.now();
      const log: any = { sourcePath, steps: [] };

      // 1. Source exists?
      try {
        const t0 = Date.now();
        const [exists] = await bucket.file(sourcePath).exists();
        log.steps.push({ step: 'source_exists', ok: exists, ms: Date.now() - t0, value: exists });
        if (!exists) {
          log.finalStatus = 'source_missing';
          log.totalMs = Date.now() - startedAt;
          results.push(log);
          continue;
        }
      } catch (e: any) {
        log.steps.push({ step: 'source_exists', ok: false, ms: 0, error: e?.message });
        log.finalStatus = 'source_check_error';
        log.totalMs = Date.now() - startedAt;
        results.push(log);
        continue;
      }

      // 2. Get metadata (size + content type)
      try {
        const t0 = Date.now();
        const [meta] = await bucket.file(sourcePath).getMetadata();
        log.steps.push({
          step: 'source_metadata',
          ok: true,
          ms: Date.now() - t0,
          value: { size: Number(meta.size), contentType: meta.contentType },
        });
      } catch (e: any) {
        log.steps.push({ step: 'source_metadata', ok: false, ms: 0, error: e?.message });
      }

      // 3. Copy pra lovepages/{fakePageId}/
      const fileName = sourcePath.split('/').pop() || 'file';
      const targetPath = `lovepages/${fakePageId}/test/${fileName}`;
      try {
        const t0 = Date.now();
        await bucket.file(sourcePath).copy(bucket.file(targetPath));
        log.steps.push({ step: 'copy_to_lovepages', ok: true, ms: Date.now() - t0, value: targetPath });
      } catch (e: any) {
        log.steps.push({ step: 'copy_to_lovepages', ok: false, ms: 0, error: e?.message, code: e?.code });
        log.finalStatus = 'copy_failed';
        log.totalMs = Date.now() - startedAt;
        results.push(log);
        continue;
      }

      // 4. Verify target exists
      try {
        const t0 = Date.now();
        const [exists] = await bucket.file(targetPath).exists();
        log.steps.push({ step: 'target_exists', ok: exists, ms: Date.now() - t0 });
      } catch (e: any) {
        log.steps.push({ step: 'target_exists', ok: false, ms: 0, error: e?.message });
      }

      // 5. Cleanup — deleta target + source (test, não polui)
      try {
        const t0 = Date.now();
        await bucket.file(targetPath).delete().catch(() => {});
        log.steps.push({ step: 'cleanup_target', ok: true, ms: Date.now() - t0 });
      } catch { /* best effort */ }

      log.finalStatus = 'success';
      log.totalMs = Date.now() - startedAt;
      results.push(log);
    }

    return NextResponse.json({ ok: true, fakePageId, results });
  } catch (err: any) {
    return NextResponse.json({ error: 'failed', message: err?.message }, { status: 500 });
  }
}
