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

  const prompt = `You are an elite sports nutritionist AI. The athlete ate: "${foodDescription}".

Estimate the calories and macros for a typical athlete-sized portion of this food.
Return ONLY a JSON object — no markdown, no extra text:
{
  "foodName": "clean name for this food",
  "calories": <integer>,
  "macros": { "protein": <integer grams>, "carbs": <integer grams>, "fats": <integer grams>, "sugar": <integer grams> },
  "confidence": <0.0–1.0>,
  "analysis": "one sentence explaining the estimate (key ingredients, portion assumptions)"
}
Rules: use athlete/active person portion sizes (larger than sedentary average). If the input is not food, return foodName "Unknown" with all zeros.`;

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
