
'use server';
/**
 * @fileOverview Provides a function to find a YouTube video URL for a given song.
 *
 * - findYoutubeVideo - A function that searches YouTube and returns a video URL.
 * - FindVideoInput - The input type for the findYoutubeVideo function.
 * - FindVideoOutput - The return type for the findYoutubeVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import YouTube from 'youtube-sr';

const FindVideoInputSchema = z.object({
  songName: z.string().describe('The name of the song to search for.'),
  artistName: z.string().describe('The name of the artist.'),
});
export type FindVideoInput = z.infer<typeof FindVideoInputSchema>;

const FindVideoOutputSchema = z.object({
  url: z.string().describe('The YouTube URL of the found video.'),
});
export type FindVideoOutput = z.infer<typeof FindVideoOutputSchema>;


const searchYoutubeTool = ai.defineTool(
    {
      name: 'searchYoutubeTool',
      description: 'Search for a YouTube video and return the URL.',
      inputSchema: z.object({ query: z.string() }),
      outputSchema: z.string(),
    },
    async ({ query }) => {
      try {
        const video = await YouTube.searchOne(query, 'video');
        return video?.url || '';
      } catch (error) {
        console.error('Error in searchYoutubeTool:', error);
        return '';
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
    const query = `${input.songName} ${input.artistName}`;
    const url = await searchYoutubeTool({ query });
    
    if (url && url.startsWith('http')) {
        return { url };
    }

    throw new Error('Could not find a video for the given song and artist.');
  }
);

    