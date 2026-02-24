
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
      description: 'Search for a YouTube video and return the URL. Throws an error if not found.',
      inputSchema: z.object({ query: z.string() }),
      outputSchema: z.string(),
    },
    async ({ query }) => {
      try {
        const video = await YouTube.searchOne(query, 'video');
        if (video?.url) {
            return video.url;
        }
        // Throw a specific, controlled error if no video is found.
        throw new Error('No video found for the specified query.');
      } catch (error) {
        console.error('Error in searchYoutubeTool:', error);
        // Re-throw the error to be caught by the calling flow.
        throw new Error(`Failed to search YouTube: ${error instanceof Error ? error.message : String(error)}`);
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
    
    // Wrap the tool call in a try/catch block to handle potential failures gracefully.
    try {
        const url = await searchYoutubeTool({ query });
        
        // The tool now guarantees a valid URL or throws.
        return { url };

    } catch (error) {
        console.error(`findVideoFlow Error for query "${query}":`, error);
        // Propagate a user-friendly error message.
        throw new Error('Could not find a video for the given song and artist.');
    }
  }
);
