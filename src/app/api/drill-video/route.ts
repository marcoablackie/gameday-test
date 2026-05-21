import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ videoId: null });

  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ videoId: null });

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    maxResults: '1',
    key: apiKey,
  });

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId ?? null;
    return NextResponse.json({ videoId });
  } catch {
    return NextResponse.json({ videoId: null });
  }
}
