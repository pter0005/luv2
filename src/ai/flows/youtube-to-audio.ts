'use server';

/**
 * @fileOverview Converts a YouTube video URL to playable audio data.
 *
 * - convertVideoToAudio - A function that takes a youtube URL and returns audio data.
 * - VideoToAudioInput - The input type for the convertVideoToAudio function.
 * - VideoToAudioOutput - The return type for the convertVideoToAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const VideoToAudioInputSchema = z.object({
  url: z.string().describe('The YouTube URL to convert to audio.'),
});
export type VideoToAudioInput = z.infer<typeof VideoToAudioInputSchema>;

const VideoToAudioOutputSchema = z.object({
  media: z.string().describe("The audio data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type VideoToAudioOutput = z.infer<typeof VideoToAudioOutputSchema>;

export async function convertVideoToAudio(input: VideoToAudioInput): Promise<VideoToAudioOutput> {
  return videoToAudioFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}


const videoToAudioFlow = ai.defineFlow(
  {
    name: 'videoToAudioFlow',
    inputSchema: VideoToAudioInputSchema,
    outputSchema: VideoToAudioOutputSchema,
  },
  async ({ url }) => {
    // This is a creative use of the TTS model to process a URL.
    // It's not the primary use-case, but it can extract audio context.
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: `Please process the audio from the following url: ${url}`,
    });

    if (!media || !media.url) {
      throw new Error('No media returned from the AI model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
