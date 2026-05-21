'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractFixturesInputSchema = z.object({
  photoDataUri: z.string().describe("A screenshot of a fixture/schedule list as a data URI (base64)."),
});
export type ExtractFixturesInput = z.infer<typeof ExtractFixturesInputSchema>;

const GameSchema = z.object({
  opponent: z.string().describe('Name of the opposing team.'),
  date: z.string().describe('Date of the game in YYYY-MM-DD format. Infer the year if not shown.'),
  time: z.string().describe('Kick-off time in HH:MM 24h format. Use "00:00" if unknown.'),
  venue: z.string().describe('Venue or location. Use "TBC" if not visible.'),
  competition: z.string().describe('Competition or league name if visible, otherwise "League".'),
  isHome: z.boolean().describe('True if this is a home game, false if away. Use true if unclear.'),
});

const ExtractFixturesOutputSchema = z.object({
  games: z.array(GameSchema).describe('All fixtures found in the image.'),
  confidence: z.number().describe('Confidence score 0-1 that the image contained fixture data.'),
  note: z.string().describe('Short note about what was found or any issues reading the image.'),
});
export type ExtractFixturesOutput = z.infer<typeof ExtractFixturesOutputSchema>;
export type GameFixture = z.infer<typeof GameSchema>;

export async function extractFixtures(input: ExtractFixturesInput): Promise<ExtractFixturesOutput> {
  return extractFixturesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractFixturesPrompt',
  input: { schema: ExtractFixturesInputSchema },
  output: { schema: ExtractFixturesOutputSchema },
  prompt: `You are reading a screenshot of a sports fixture list or schedule from a league app (like Dribl, PlayHQ, SportsTG, or similar).

Extract every game/match visible in this image.

Image: {{media url=photoDataUri}}

Rules:
- Extract ALL games visible, including past and future ones
- For dates, use YYYY-MM-DD format. If the year isn't shown, assume the current or next upcoming year
- For times, use HH:MM 24-hour format
- If a field isn't visible, use sensible defaults: venue="TBC", time="00:00", competition="League"
- Home/away: look for "H" or "A" labels, or "vs" (home) vs "@" (away)
- If the image doesn't contain fixture data at all, return an empty games array with confidence 0`,
});

const extractFixturesFlow = ai.defineFlow(
  {
    name: 'extractFixturesFlow',
    inputSchema: ExtractFixturesInputSchema,
    outputSchema: ExtractFixturesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
