import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

if (!process.env.GOOGLE_GENAI_API_KEY) {
  throw new Error('GOOGLE_GENAI_API_KEY is not set');
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: googleAI.model('gemini-2.5-flash'),
});
