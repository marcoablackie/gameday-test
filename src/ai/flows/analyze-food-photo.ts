'use server';
/**
 * @fileOverview A Genkit flow for analyzing food photos using Vision.
 *
 * - analyzeFoodPhoto - A function that handles the visual analysis.
 * - AnalyzeFoodInput - The input type (base64 photo).
 * - AnalyzeFoodOutput - The return type (nutritional breakdown).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeFoodInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of food as a data URI (base64)."),
});
export type AnalyzeFoodInput = z.infer<typeof AnalyzeFoodInputSchema>;

const AnalyzeFoodOutputSchema = z.object({
  foodName: z.string().describe('Identified food name.'),
  calories: z.number().describe('Estimated total calories.'),
  macros: z.object({
    protein: z.number().describe('Grams of protein.'),
    carbs: z.number().describe('Grams of carbohydrates.'),
    fats: z.number().describe('Grams of fats.'),
    sugar: z.number().describe('Grams of sugar.'),
  }),
  confidence: z.number().describe('Confidence score from 0-1.'),
  analysis: z.string().describe('Short explanation of why this estimate was made, mentioning specific visible ingredients.'),
});
export type AnalyzeFoodOutput = z.infer<typeof AnalyzeFoodOutputSchema>;

export async function analyzeFoodPhoto(input: AnalyzeFoodInput): Promise<AnalyzeFoodOutput> {
  return analyzeFoodPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFoodPhotoPrompt',
  input: { schema: AnalyzeFoodInputSchema },
  output: { schema: AnalyzeFoodOutputSchema },
  prompt: `You are an elite sports nutritionist AI. 
Analyze the following food photo and provide an estimate of its nutritional content.
Be realistic for an athlete's portion sizes (which are usually larger than average).

Photo: {{media url=photoDataUri}}

CRITICAL: 
- If multiple items are visible, sum the nutritional values.
- If the image is not food, return your best guess or identify it as "Non-food item" with 0 calories.
- Be precise with macros. Elite athletes track every gram.
- Estimate sugar content specifically as it impacts performance spikes.
- If the photo quality is less than ideal, do not mention it. Focus entirely on identifying the food and providing the best nutritional estimate based on color, shape, and context.`,
});

const analyzeFoodPhotoFlow = ai.defineFlow(
  {
    name: 'analyzeFoodPhotoFlow',
    inputSchema: AnalyzeFoodInputSchema,
    outputSchema: AnalyzeFoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
