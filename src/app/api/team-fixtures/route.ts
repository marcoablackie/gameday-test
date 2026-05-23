import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rate-limit';

const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

type SportsDBEvent = {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  idHomeTeam: string;
  strHomeTeamBadge?: string;
  strAwayTeam: string;
  idAwayTeam: string;
  strAwayTeamBadge?: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  dateEventLocal?: string;
  strTime: string;
  strTimeLocal?: string;
  strTimestamp?: string;
  strVenue: string;
  strStatus: string;
  strLeague: string;
};

function toUnifiedFixture(e: SportsDBEvent, teamId: string) {
  const dateStr = e.dateEventLocal || e.dateEvent;
  const timeStr = e.strTimeLocal || e.strTime || '00:00:00';
  const matchDate = `${dateStr} ${timeStr}`;
  const isHome = e.idHomeTeam === teamId;
  return {
    matchDate,
    venue: e.strVenue || '',
    homeTeam: { name: e.strHomeTeam, logo: e.strHomeTeamBadge || '' },
    awayTeam: { name: e.strAwayTeam, logo: e.strAwayTeamBadge || '' },
    homeScore: e.intHomeScore ?? null,
    awayScore: e.intAwayScore ?? null,
    status: e.strStatus || '',
    league: e.strLeague || '',
    isHome,
    opponentName: isHome ? e.strAwayTeam : e.strHomeTeam,
    opponentLogo: isHome ? (e.strAwayTeamBadge || '') : (e.strHomeTeamBadge || ''),
    source: 'sportsdb' as const,
  };
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(getIP(req), 'team-fixtures');
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });

  const teamId = req.nextUrl.searchParams.get('id');
  if (!teamId) return NextResponse.json({ error: 'Missing team id' }, { status: 400 });

  try {
    const [nextRes, lastRes] = await Promise.all([
      fetch(`${SPORTSDB_BASE}/eventsnext.php?id=${teamId}`, { next: { revalidate: 1800 } }),
      fetch(`${SPORTSDB_BASE}/eventslast.php?id=${teamId}`, { next: { revalidate: 1800 } }),
    ]);

    const [nextData, lastData] = await Promise.all([nextRes.json(), lastRes.json()]);

    const upcoming: SportsDBEvent[] = nextData.events ?? [];
    const past: SportsDBEvent[] = lastData.results ?? [];

    const fixtures = [
      ...upcoming.map(e => toUnifiedFixture(e, teamId)),
      ...past.map(e => toUnifiedFixture(e, teamId)),
    ];

    return NextResponse.json({ fixtures });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
