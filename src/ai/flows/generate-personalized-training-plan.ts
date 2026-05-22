'use server';
/**
 * @fileOverview A Genkit flow for generating a hyper-personalized daily performance schedule.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePersonalizedTrainingPlanInputSchema = z.object({
  sport: z.string(),
  position: z.string(),
  bestAbilities: z.array(z.string()),
  areaToImprove: z.array(z.string()),
  schoolStartTime: z.string().describe('Format HH:mm'),
  schoolEndTime: z.string().describe('Format HH:mm'),
  height: z.string().optional().describe('Athlete height'),
  weight: z.string().optional().describe('Athlete weight'),
  age: z.string().optional().describe('Athlete age'),
  upcomingGameDetails: z.string().optional(),
  recentFeedback: z.string().optional(),
  trainingDays: z.array(z.string()).optional().describe('Days athlete trains, e.g. ["Mon","Wed","Fri","Sat"]. All other days are rest days.'),
  trainingTime: z.string().optional().describe('Preferred training time in HH:mm format'),
  todayDayOfWeek: z.string().optional().describe('Current day of week short name, e.g. "Mon", "Tue"'),
  isGameDay: z.boolean().optional().describe('True if the athlete has a match scheduled for today'),
});

const GeneratePersonalizedTrainingPlanOutputSchema = z.object({
  dailyFocusTitle: z.string().describe("A concise title for today's training focus."),
  schedule: z.array(z.object({
    time: z.string().describe('The time for the activity. Use 24h format (e.g., 07:00, 18:30) for data consistency.'),
    activity: z.string().describe('Short title (e.g., Post-School Fuel).'),
    type: z.enum(['training', 'nutrition', 'recovery', 'sleep', 'school']),
    intel: z.string().describe('Detailed execution steps. For drills, give 3-4 specific technical steps. For meals, give 2-3 simple prep steps.'),
    ingredients: z.array(z.string()).optional().describe('ONLY basic common items: Eggs, Rice, Chicken, Fruit, Bread, Milk.'),
    youtubeSearchQuery: z.string().optional().describe('A specific search query to find this drill on YouTube.'),
  })),
});

export type GeneratePersonalizedTrainingPlanOutput = z.infer<typeof GeneratePersonalizedTrainingPlanOutputSchema>;

export async function generatePersonalizedTrainingPlan(
  input: z.infer<typeof GeneratePersonalizedTrainingPlanInputSchema>
): Promise<GeneratePersonalizedTrainingPlanOutput> {
  return generatePersonalizedTrainingPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedTrainingPlanPrompt',
  input: { schema: GeneratePersonalizedTrainingPlanInputSchema },
  output: { schema: GeneratePersonalizedTrainingPlanOutputSchema },
  prompt: `You are a professional performance coach. Create a realistic daily protocol.

Athlete: {{{sport}}} ({{{position}}})
Physicals: {{#if height}}{{{height}}}{{/if}} {{#if weight}}{{{weight}}}{{/if}}
Targeting: {{#each areaToImprove}}{{{this}}}, {{/each}}
School: {{{schoolStartTime}}} to {{{schoolEndTime}}}
{{#if trainingDays}}Training Days: {{#each trainingDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}} — all other days are REST days.
Today: {{todayDayOfWeek}}{{/if}}
{{#if trainingTime}}Preferred training time: {{{trainingTime}}}{{/if}}
{{#if isGameDay}}TODAY IS A MATCH DAY.{{/if}}

RULES:
1. SCHOOL LOCKOUT: NO training/nutrition allowed between {{{schoolStartTime}}} and {{{schoolEndTime}}}. Exactly one block: "School Attendance" during this window.
2. NO MORNING TRAINING: Morning (before school) is strictly for hydration and 1 simple snack. No exercise.
3. DINNER REALISM: For Dinner, acknowledge it is a family meal. Focus on "Plate Balance" (e.g., "Ensure a palm-sized protein, fist-sized carb, and plenty of greens") rather than a specific recipe.
4. EXTREME SIMPLICITY: Other meals must use only basic kitchen staples (Eggs, Chicken, Rice, Fruit, Bread).
5. DRILL DEPTH: Drills must have 3-4 specific technical steps as a numbered list. Be unique to being a {{{position}}} in {{{sport}}}.
6. Use 24-hour format (HH:mm) for the "time" field internally for consistency.
7. TRAINING vs REST: If today ({{todayDayOfWeek}}) is NOT in the training days list, this is a REST DAY. On rest days, replace all training blocks with "Active Recovery" (light stretching, foam rolling, or an easy walk). Do NOT schedule intense drills on rest days. If today IS a training day, schedule the main drill block near the preferred training time.
8. GAME DAY NUTRITION: {{#if isGameDay}}TODAY IS A MATCH DAY. Schedule a pre-match breakfast block in the morning (around 07:00–08:00) with the intel: light, easy-to-digest carb-rich food only — e.g. white toast with honey, banana and water, or plain oats. NO heavy food, NO eggs, NO dairy, NO high-fat or high-fibre items that could cause stomach issues. The meal should be done 2–3 hours before kickoff. Also include a post-match recovery nutrition block. Skip intense training drills today — the match is the session.{{else}}Standard nutrition rules apply.{{/if}}
`,
});

const generatePersonalizedTrainingPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedTrainingPlanFlow',
    inputSchema: GeneratePersonalizedTrainingPlanInputSchema,
    outputSchema: GeneratePersonalizedTrainingPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
