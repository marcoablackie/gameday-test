import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';

const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  const { ok } = rateLimit(getIP(req), 'analyze-food');
  if (!ok) return NextResponse.json({ error: 'Too many requests — try again in a minute.' }, { status: 429 });

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  let photoDataUri: string;
  try {
    ({ photoDataUri } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const mimeMatch = photoDataUri.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
  const base64Data = photoDataUri.replace(/^data:image\/[a-z]+;base64,/, '');

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are an elite sports nutritionist AI. Analyse this food photo for an athlete.

STEP 1 — Identify every visible food item in the photo separately.
STEP 2 — Estimate a realistic athlete portion size for each item (not diet-book minimums).
STEP 3 — Sum everything into one total.

Common reference points: cooked chicken breast ~165 kcal/150g, white rice cooked ~200 kcal/cup, pasta cooked ~220 kcal/cup, eggs ~70 kcal each, avocado half ~120 kcal, banana ~100 kcal.
If it looks like a restaurant or takeaway serve, use those realistic portions (larger).

Return ONLY a JSON object — no markdown, no extra text:
{
  "foodName": "brief name of the overall meal or dish",
  "calories": <integer — total for the whole plate>,
  "macros": { "protein": <integer grams>, "carbs": <integer grams>, "fats": <integer grams>, "sugar": <integer grams> },
  "confidence": <0.5–1.0 — lower if photo is unclear or partially visible>,
  "analysis": "one sentence: list main items spotted, portion assumptions made"
}
If the image contains no food, return foodName "Unknown" with all zeros and confidence 0.`,
            },
            { inlineData: { mimeType: mimeType, data: base64Data } },
          ],
        }],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error('Gemini API error:', geminiRes.status, errText);
    return NextResponse.json({ error: `Gemini ${geminiRes.status}: ${errText.slice(0, 300)}` }, { status: 502 });
  }

  const geminiData = await geminiRes.json();
  const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON in Gemini response:', rawText);
    return NextResponse.json({ error: 'No JSON in response' }, { status: 502 });
  }

  try {
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to parse response' }, { status: 502 });
  }
}
