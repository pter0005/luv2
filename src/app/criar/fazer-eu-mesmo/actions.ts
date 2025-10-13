"use server";

import { suggestContent, SuggestContentInput } from "@/ai/flows/ai-powered-content-suggestion";
import { z } from "zod";

const schema = z.object({
  userInput: z.string().min(10, { message: "Por favor, descreva com mais detalhes." }),
});

export async function handleSuggestContent(formData: FormData) {
  const userInput = formData.get("userInput");

  const validatedFields = schema.safeParse({
    userInput: userInput,
  });

  if (!validatedFields.success) {
    return {
      error: "Input inválido.",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await suggestContent(validatedFields.data as SuggestContentInput);
    return { suggestions: result.suggestions };
  } catch (error) {
    console.error("Error calling GenAI flow:", error);
    return { error: "Ocorreu um erro ao gerar sugestões. Tente novamente." };
  }
}
