import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const { ingredients, mealName, sport, position } = await req.json().catch(() => ({}));

  const prompt = `You are a sports nutrition coach for a young ${sport || 'athlete'} (${position || 'player'}).
Their planned meal was: "${mealName || 'a performance meal'}".
They have these ingredients available: ${ingredients || 'basic pantry items'}.

Create ONE simple replacement meal. Use whichever of those ingredients make the best combination — you do NOT need to use all of them, just pick what works well together. Keep it quick (under 10 min), no special equipment, high-performance, and genuinely tasty.

Return ONLY valid JSON, no markdown fences:
{
  "name": "short meal name",
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
          generationConfig: { temperature: 0.7 },
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
