import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';

const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  const { ok } = rateLimit(getIP(req), 'lookup-food');
  if (!ok) return NextResponse.json({ error: 'Too many requests — try again in a minute.' }, { status: 429 });

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const { foodDescription } = await req.json().catch(() => ({}));
  if (!foodDescription) return NextResponse.json({ error: 'No food description provided' }, { status: 400 });

  const prompt = `You are an elite sports nutritionist AI. An athlete just told you what they ate:
"${foodDescription}"

Your job: estimate the total calories and macros for everything described.

PARSING RULES:
1. If quantities are given (e.g. "2 eggs", "200g chicken", "large bowl"), use them precisely.
2. If no quantity is given, assume a standard athlete-sized portion (1.5–2× sedentary adult average).
3. If multiple foods are listed, sum all of them into one total response.
4. Common Australian foods to know: Weetbix (67 kcal/biscuit), Vegemite toast (~130 kcal/slice), Tim Tam (95 kcal/biscuit), Milo drink (~160 kcal/cup), meat pie (~450 kcal), sausage roll (~280 kcal), Up&Go (~180 kcal), Shapes crackers (~160 kcal/pack).
5. For restaurant or fast food meals, use realistic serve sizes (not diet-book minimums).

Return ONLY a JSON object — no markdown, no extra text:
{
  "foodName": "concise name summarising the full meal",
  "calories": <integer — total for everything described>,
  "macros": { "protein": <integer grams>, "carbs": <integer grams>, "fats": <integer grams>, "sugar": <integer grams> },
  "confidence": <0.5–1.0 — lower when ambiguous>,
  "analysis": "one sentence: list main items, portion assumptions, and any caveats"
}
If the input is not food at all, return foodName "Unknown" with all zeros and confidence 0.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  if (!res.ok) return NextResponse.json({ error: 'AI unavailable' }, { status: 502 });

  const data = await res.json();
  const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: 'Bad AI response' }, { status: 502 });

  try {
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
  }
}
