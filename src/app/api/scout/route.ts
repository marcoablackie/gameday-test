import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';

const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  const { ok } = rateLimit(getIP(req), 'scout');
  if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const { opponentName, competition, sport, position } = await req.json().catch(() => ({}));
  if (!opponentName || !sport) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const prompt = `You are a tactical analyst briefing a ${sport} ${position || 'player'} before a match against "${opponentName}"${competition ? ` in ${competition}` : ''}.

Write a sharp, realistic 3-point scout report. Be sport-specific and direct — no fluff.

Return ONLY valid JSON, no markdown fences:
{
  "threats": "One sentence: their main danger — what to watch for defensively",
  "exploit": "One sentence: a likely weakness or how to hurt them going forward",
  "tip": "One sentence: one tactical cue specific to a ${position || 'player'} in this match"
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
    if (!match) return NextResponse.json({ error: 'Bad response' }, { status: 502 });
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
