import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';

const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  const { ok } = rateLimit(getIP(req), 'snack');
  if (!ok) return NextResponse.json({ error: 'Too many requests — try again in a minute.' }, { status: 429 });

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const { sport, position, weight, caloriesLogged } = await req.json().catch(() => ({}));

  const prompt = `You are a performance nutrition coach for a ${sport || 'athlete'} (${position || 'player'}).
${weight ? `Athlete weight: ${weight}.` : ''}
${caloriesLogged ? `Already consumed today: ~${caloriesLogged} kcal.` : ''}

Design ONE quick snack that:
- Uses ONLY basic everyday kitchen items (oats, bread, peanut butter, honey, banana, apple, yogurt, milk, eggs, rice cakes, dark chocolate, fruit, nuts)
- Takes under 5 minutes with zero special equipment
- Looks completely ordinary — something any parent would make — nothing unusual
- Has a real performance benefit (energy, protein, recovery, hydration)
- Tastes genuinely sweet and good

Return ONLY valid JSON, no markdown fences:
{
  "name": "short snack name",
  "benefit": "single performance benefit phrase (max 6 words)",
  "steps": ["step 1 (concise)", "step 2 (concise)", "step 3 (concise)"],
  "kcal": <integer>,
  "protein": <integer>,
  "carbs": <integer>,
  "fats": <integer>
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.95 },
        }),
      }
    );

    if (!res.ok) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 });

    const data = await res.json();
    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'Bad AI response' }, { status: 502 });

    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
