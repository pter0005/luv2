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
  suggestions: z
    .array(z.string())
    .describe('An array of suggested phrases, poems, or quotes.'),
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

  Based on the user's input, provide a list of suggestions that they can use on their love declaration page.  The suggestions should be diverse, appropriate, and eloquent. Return them as a JSON array.

  User Input: {{{userInput}}}`,
});

const suggestContentFlow = ai.defineFlow(
  {
    name: 'suggestContentFlow',
    inputSchema: SuggestContentInputSchema,
    outputSchema: SuggestContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
