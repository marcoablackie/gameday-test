import { NextResponse } from 'next/server';

// Vercel caches the full response for 6 hours — no repeated Dribl calls
export const revalidate = 21600;

const HEADERS = {
  accept: 'application/json',
  'x-requested-with': 'XMLHttpRequest',
};

const FSC_HOST = 'fsc.dribl.com';
const FSC_SLUG = 'fsc';
const SEASON_START = '2026-03-01';
const SEASON_END = '2026-10-31';

export async function GET() {
  try {
    // 1. Tenant ID
    const tenantRes = await fetch(
      `https://mc-api.dribl.com/api/tenants?mc_link=${FSC_HOST}&slug=${FSC_SLUG}`,
      { headers: HEADERS }
    );
    const tenantJson = await tenantRes.json();
    const tenantId = tenantJson.data?.id;
    if (!tenantId) throw new Error('No tenant ID from Dribl');

    // 2. Season + clubs in parallel
    const [seasonsRes, clubsRes] = await Promise.all([
      fetch(`https://mc-api.dribl.com/api/list/seasons?disable_paging=true&tenant=${tenantId}`, { headers: HEADERS }),
      fetch(`https://mc-api.dribl.com/api/list/clubs?disable_paging=true&tenant=${tenantId}`, { headers: HEADERS }),
    ]);

    const seasonsJson = await seasonsRes.json();
    const season = seasonsJson.data?.find((s: any) => s.is_current || s.status === 'active') ?? seasonsJson.data?.[0];
    const seasonId = season?.id;

    const clubsJson = await clubsRes.json();
    const clubs = (clubsJson.data ?? []).map((c: any) => ({
      id: c.id,
      name: c.attributes?.name,
      logo: c.attributes?.image,
    }));

    // 3. Cursor-paginated fixtures
    let allFixtures: any[] = [];
    let cursor = '';
    let hasNext = true;

    while (hasNext) {
      let url = `https://mc-api.dribl.com/api/fixtures?from=${SEASON_START}&to=${SEASON_END}&season=${seasonId}&tenant=${tenantId}&timezone=Australia%2FSydney`;
      if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

      const res = await fetch(url, { headers: HEADERS });
      const payload = await res.json();
      const records: any[] = payload.data ?? [];
      allFixtures = allFixtures.concat(records);

      const nextCursor = payload.meta?.next_cursor ?? payload.next_cursor;
      if (nextCursor && records.length > 0) {
        cursor = nextCursor;
      } else {
        hasNext = false;
      }
    }

    const fixtures = allFixtures.map((f: any) => {
      const attr = f.attributes ?? {};
      return {
        id: f.hash_id || f.id,
        matchDate: attr.date,
        round: attr.full_round || attr.round,
        status: attr.status,
        competitionGroup: attr.competition_name,
        leagueTierName: attr.league_name,
        groundLocation: attr.ground_name || 'TBD',
        fieldNumber: attr.field_name || '1',
        homeTeam: { name: attr.home_team_name?.trim(), logo: attr.home_logo, score: attr.home_score },
        awayTeam: { name: attr.away_team_name?.trim(), logo: attr.away_logo, score: attr.away_score },
      };
    });

    return NextResponse.json({
      associationName: FSC_SLUG.toUpperCase(),
      seasonHash: seasonId,
      totalClubsStored: clubs.length,
      totalFixturesStored: fixtures.length,
      clubs,
      fixtures,
    });
  } catch (err) {
    console.error('FSC fixtures proxy failed:', err);
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
