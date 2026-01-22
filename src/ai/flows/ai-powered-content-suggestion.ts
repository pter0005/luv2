
'use server';

/**
 * @fileOverview Provides AI-powered suggestions for phrases, poems, or quotes to enhance a user's love declaration page.
 *
 * - suggestContent - A function that generates content suggestions based on user input.
 * - SuggestContentInput - The input type for the suggestContent function.
 * - SuggestContentOutput - The return type for the suggestContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestContentInputSchema = z.object({
  userInput: z
    .string()
    .describe(
      'The user input describing the type of content they are looking for, and any relevant context about their relationship.'
    ),
});
export type SuggestContentInput = z.infer<typeof SuggestContentInputSchema>;

const SuggestContentOutputSchema = z.object({
  romanticPhrases: z
    .array(z.string())
    .describe('An array of 2 short and creative romantic phrases.'),
  shortPoems: z
    .array(z.string())
    .describe('An array of 2 very short poems (2-4 lines).'),
  famousQuotes: z
    .array(z.string())
    .describe('An array of 2 famous quotes about love.'),
});
export type SuggestContentOutput = z.infer<typeof SuggestContentOutputSchema>;

export async function suggestContent(input: SuggestContentInput): Promise<SuggestContentOutput> {
  return suggestContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestContentPrompt',
  input: {schema: SuggestContentInputSchema},
  output: {schema: SuggestContentOutputSchema},
  prompt: `You are a love expert, skilled in writing phrases, poems, and finding quotes suitable for love declarations.
  Your task is to generate content for a user's love page based on their input.

  Generate 2 suggestions for EACH of the following categories:
  - romanticPhrases: Short, original, and creative phrases.
  - shortPoems: Very brief poems, around 2 to 4 lines long.
  - famousQuotes: Well-known quotes about love from authors, poets, or personalities.

  The suggestions should be diverse, appropriate, and eloquent.

  User Input: {{{userInput}}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }
});

const suggestContentFlow = ai.defineFlow(
  {
    name: 'suggestContentFlow',
    inputSchema: SuggestContentInputSchema,
    outputSchema: SuggestContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return any content. Please try again.");
    }
    return output;
  }
);
