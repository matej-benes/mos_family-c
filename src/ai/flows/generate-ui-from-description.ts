'use server';

/**
 * @fileOverview A UI generation AI agent.
 *
 * - generateUIFromDescription - A function that handles the UI generation process.
 * - GenerateUIFromDescriptionInput - The input type for the generateUIFromDescription function.
 * - GenerateUIFromDescriptionOutput - The return type for the generateUIFromDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUIFromDescriptionInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the UI to generate, including the desired functionality and style.'),
});
export type GenerateUIFromDescriptionInput = z.infer<typeof GenerateUIFromDescriptionInputSchema>;

const GenerateUIFromDescriptionOutputSchema = z.object({
  uiCode: z.string().describe('The generated UI code in React/TS.'),
});
export type GenerateUIFromDescriptionOutput = z.infer<typeof GenerateUIFromDescriptionOutputSchema>;

export async function generateUIFromDescription(input: GenerateUIFromDescriptionInput): Promise<GenerateUIFromDescriptionOutput> {
  return generateUIFromDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUIFromDescriptionPrompt',
  input: {schema: GenerateUIFromDescriptionInputSchema},
  output: {schema: GenerateUIFromDescriptionOutputSchema},
  prompt: `You are a UI code generation expert specializing in React/Typescript.

You will generate React/Typescript code based on the user's description, and will return only the raw code.

Description: {{{description}}}
`,
});

const generateUIFromDescriptionFlow = ai.defineFlow(
  {
    name: 'generateUIFromDescriptionFlow',
    inputSchema: GenerateUIFromDescriptionInputSchema,
    outputSchema: GenerateUIFromDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
