'use server';
/**
 * @fileOverview Provides a function to find a YouTube video URL for a given song.
 *
 * - findYoutubeVideo - A function that searches YouTube and returns a video URL.
 * - FindVideoInput - The input type for the findYoutubeVideo function.
 * - FindVideoOutput - The return type for the findYoutubeVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import YouTube from 'youtube-sr';

export const FindVideoInputSchema = z.object({
  songName: z.string().describe('The name of the song to search for.'),
  artistName: z.string().describe('The name of the artist.'),
});
export type FindVideoInput = z.infer<typeof FindVideoInputSchema>;

export const FindVideoOutputSchema = z.object({
  url: z.string().describe('The YouTube URL of the found video.'),
});
export type FindVideoOutput = z.infer<typeof FindVideoOutputSchema>;

// Tool to search on YouTube
const searchYoutubeTool = ai.defineTool(
  {
    name: 'searchYoutube',
    description: 'Search for a video on YouTube and return the URL of the first result.',
    inputSchema: z.object({
      query: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ query }) => {
    try {
      const video = await YouTube.searchOne(query, 'video');
      if (video) {
        return video.url;
      }
      return 'No video found';
    } catch (error) {
      console.error(error);
      return 'Error searching YouTube';
    }
  }
);


export async function findYoutubeVideo(input: FindVideoInput): Promise<FindVideoOutput> {
  return findVideoFlow(input);
}

const findVideoFlow = ai.defineFlow(
  {
    name: 'findVideoFlow',
    inputSchema: FindVideoInputSchema,
    outputSchema: FindVideoOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert at finding music videos. Use the provided tool to find a YouTube video for the song "${input.songName}" by "${input.artistName}". Prioritize official music videos, lyric videos, or official audio.`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      tools: [searchYoutubeTool],
    });

    const toolResponse = llmResponse.toolRequest();
    
    if (toolResponse) {
        const toolOutput = await toolResponse.run();
        const finalResponse = await ai.generate({
            prompt: `The tool returned this URL: ${toolOutput}. Please provide this URL as the final output.`,
            model: 'googleai/gemini-2.5-flash',
        });
        
        // Let's just use the direct tool output to avoid further AI confusion
        const url = toolOutput.media?.url ?? (typeof toolOutput.output === 'string' ? toolOutput.output : '');
        
        if (url && url.startsWith('http')) {
             return { url };
        }
    }
    
    // Fallback if AI or tool fails
    const fallbackUrl = await searchYoutubeTool({ query: `${input.songName} ${input.artistName}` });
    return { url: fallbackUrl };
  }
);
