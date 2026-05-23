import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';

const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  const { ok } = rateLimit(getIP(req), 'parse-fixtures');
  if (!ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });

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

  const prompt = `You are an AI extracting sports fixture and match schedule data from a photo or screenshot.

Carefully read every game/match listed in the image and extract them all.

Return ONLY a valid JSON object — no markdown, no explanation, no extra text:
{
  "fixtures": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "opponent": "Opponent team or club name",
      "venue": "Ground or location name, or null if not shown",
      "isHome": true or false or null
    }
  ]
}

Rules:
- Convert all dates to ISO format YYYY-MM-DD. Assume current year (2026) unless another year is clearly visible.
- Convert all times to 24-hour HH:MM format. If no time shown, use null.
- "opponent" is the other team — not your team.
- "isHome" is true if it says "Home", "vs" followed by the opponent, or similar. False if "Away" or "@". Null if unknown.
- If the image contains no fixture data, return { "fixtures": [] }.
- Include ALL matches visible, even if already played (include past fixtures too).`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Data } },
            ],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini ${res.status}: ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ fixtures: [] });

    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ fixtures: parsed.fixtures ?? [] });
  } catch {
    return NextResponse.json({ error: 'Failed to parse fixtures' }, { status: 500 });
  }
}
