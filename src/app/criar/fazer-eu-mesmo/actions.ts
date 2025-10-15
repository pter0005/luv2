'use server';

import { suggestContent } from '@/ai/flows/ai-powered-content-suggestion';

/**
 * Handles the form submission for AI content suggestions.
 * @param formData - The form data containing the user's input.
 * @returns An object with either suggestions or an error message.
 */
export async function handleSuggestContent(formData: FormData) {
  const userInput = formData.get('userInput') as string;

  if (!userInput) {
    return { error: 'Por favor, descreva o que você gostaria de sugerir.' };
  }

  try {
    const result = await suggestContent({ userInput });
    return { suggestions: result.suggestions };
  } catch (e: any) {
    console.error('Error suggesting content:', e);
    return { error: 'Ocorreu um erro ao gerar sugestões. Tente novamente.' };
  }
}
