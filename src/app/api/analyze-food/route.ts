import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODEL = 'gemini-2.0-flash';

export async function POST(req: NextRequest) {
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
              text: `You are an elite sports nutritionist AI. Analyse this food photo.
Return ONLY a JSON object with exactly these fields — no markdown, no extra text:
{
  "foodName": "name of the food or dish",
  "calories": <integer>,
  "macros": { "protein": <g>, "carbs": <g>, "fats": <g>, "sugar": <g> },
  "confidence": <0.0–1.0>,
  "analysis": "one sentence mentioning the visible ingredients and why you estimated these values"
}
Rules: athlete portion sizes (larger than average). Sum all visible items. If not food, use foodName "Unknown" with all zeros.`,
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
    return NextResponse.json({ error: 'Gemini API error' }, { status: 502 });
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
