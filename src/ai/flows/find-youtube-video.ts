'use server';
/**
 * Busca direta no YouTube via youtube-sr — sem genkit/Gemini.
 *
 * O wrapper genkit anterior só servia pra encapsular ai.defineTool, mas a
 * busca em si é só uma chamada HTTP. Tirar genkit aqui evita que o webpack
 * puxe `@/ai/genkit` (e portanto GEMINI_API_KEY) pro bundle do client quando
 * CreatePageWizard.tsx importa esta função.
 */

import YouTube from 'youtube-sr';

export type FindVideoInput = {
  songName: string;
  artistName: string;
};

export type FindVideoOutput = {
  url: string;
};

export async function findYoutubeVideo(input: FindVideoInput): Promise<FindVideoOutput> {
  // Cap em 100 chars: nome de música + artista raramente passa de 60-80.
  // Sem cap, query gigante (DoS / payload abuse) podia travar youtube-sr.
  const songName = String(input.songName || '').slice(0, 80);
  const artistName = String(input.artistName || '').slice(0, 60);
  const query = `${songName} ${artistName}`.trim().slice(0, 100);
  if (!query) throw new Error('Empty query.');

  try {
    const video = await YouTube.searchOne(query, 'video');
    if (!video?.url) throw new Error('No video found for the specified query.');
    return { url: video.url };
  } catch (error) {
    console.error(`findYoutubeVideo error for query "${query}":`, error);
    throw new Error('Could not find a video for the given song and artist.');
  }
}
