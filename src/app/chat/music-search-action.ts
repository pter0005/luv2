'use server';

import YouTube from 'youtube-sr';

export interface MusicSearchResult {
  url: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string; // mm:ss
}

export async function searchMusic(query: string): Promise<{ results?: MusicSearchResult[]; error?: string }> {
  const q = (query || '').trim();
  if (q.length < 2) return { results: [] };

  try {
    const videos = await YouTube.search(q, { limit: 8, type: 'video', safeSearch: true });
    const results: MusicSearchResult[] = videos
      .filter((v) => !!v.url && !!v.title)
      .slice(0, 6)
      .map((v) => {
        const secs = Math.round((v.duration || 0) / 1000);
        const mm = Math.floor(secs / 60);
        const ss = secs % 60;
        return {
          url: v.url!,
          title: v.title || 'Sem título',
          channel: v.channel?.name || '',
          thumbnail:
            v.thumbnail?.url ||
            `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          duration: secs > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : '',
        };
      });
    return { results };
  } catch (err: any) {
    console.error('[searchMusic] error:', err?.message);
    return { error: 'Erro na busca. Tenta colar o link direto.' };
  }
}
