import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';

const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

export async function GET(req: NextRequest) {
  const rl = rateLimit(getIP(req), 'search-teams');
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });

  const q = req.nextUrl.searchParams.get('q');
  const sport = req.nextUrl.searchParams.get('sport'); // optional filter

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  try {
    const res = await fetch(`${SPORTSDB_BASE}/searchteams.php?t=${encodeURIComponent(q.trim())}`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    let teams = (data.teams ?? []) as Array<{
      idTeam: string;
      strTeam: string;
      strSport: string;
      strLeague: string;
      idLeague: string;
      strBadge: string;
      strStadium: string;
      strCountry: string;
    }>;

    if (sport) {
      teams = teams.filter(t => t.strSport?.toLowerCase() === sport.toLowerCase());
    }

    const result = teams.slice(0, 8).map(t => ({
      idTeam: t.idTeam,
      strTeam: t.strTeam,
      strSport: t.strSport,
      strLeague: t.strLeague,
      idLeague: t.idLeague,
      strBadge: t.strBadge,
      strStadium: t.strStadium,
      strCountry: t.strCountry,
    }));

    return NextResponse.json({ teams: result });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}
