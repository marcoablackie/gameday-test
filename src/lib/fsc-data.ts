// Shared loader and utilities for FSC season data.
// The JSON lives in /public/data/ so it's fetched lazily (never bundled).

export type FSCTeam = { name?: string; logo: string; score: number | null };
export type FSCFixture = {
  id: string;
  matchDate: string;
  round: string;
  status: string;
  competitionGroup: string;
  leagueTierName: string;
  groundLocation: string;
  fieldNumber: string;
  homeTeam: FSCTeam;
  awayTeam: FSCTeam;
};
export type FSCClub = { id: string; name: string; logo: string };
export type FSCData = { associationName: string; clubs: FSCClub[]; fixtures: FSCFixture[] };

// Module-level singleton — only one fetch per page session.
let _cache: FSCData | null = null;
let _promise: Promise<FSCData> | null = null;

export function loadFSCData(): Promise<FSCData> {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) {
    _promise = fetch('/data/fsc_clean_season_database.json')
      .then(r => r.json())
      .then((d: FSCData) => { _cache = d; return d; });
  }
  return _promise;
}

// ─── Date / time ────────────────────────────────────────────────────────────

// Australia/Sydney DST rules:
//   AEDT (UTC+11): first Sunday of October → first Sunday of April
//   AEST (UTC+10): first Sunday of April   → first Sunday of October
function sydneyOffsetHours(utcDate: Date): number {
  const y = utcDate.getUTCFullYear();
  const firstSundayOf = (month: number) => {
    const d = new Date(Date.UTC(y, month, 1));
    while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  };
  const dstEnd = firstSundayOf(3);   // first Sunday of April  → clocks back
  const dstStart = firstSundayOf(9); // first Sunday of October → clocks fwd
  return utcDate >= dstEnd && utcDate < dstStart ? 10 : 11;
}

export function parseMatchDate(isoString: string): Date {
  const utc = new Date(isoString);
  return new Date(utc.getTime() + sydneyOffsetHours(utc) * 3_600_000);
}

export function formatDayHeader(localDate: Date): string {
  return localDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatKickoff(localDate: Date): string {
  return localDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Name parsing ────────────────────────────────────────────────────────────

export function parseTeamName(
  name: string | undefined,
  clubs: FSCClub[]
): { clubName: string; grade: string } {
  if (!name) return { clubName: 'TBC', grade: '' };

  // Premier League teams use double-space as separator
  if (name.includes('  ')) {
    const idx = name.indexOf('  ');
    const grade = name.slice(idx).trim().replace(/\s+Male$|\s+Female$/, '').trim();
    return { clubName: name.slice(0, idx).trim(), grade };
  }

  // Match against known club names — try longest first to avoid partial matches
  const sorted = [...clubs].sort((a, b) => b.name.length - a.name.length);
  for (const club of sorted) {
    if (name.toLowerCase().startsWith(club.name.toLowerCase())) {
      const grade = name.slice(club.name.length).trim().replace(/\s+Male$|\s+Female$/, '').trim();
      return { clubName: club.name, grade };
    }
  }

  return { clubName: name, grade: '' };
}

// ─── Fixture filtering & grouping ────────────────────────────────────────────

export function fixturesForClub(fixtures: FSCFixture[], clubName: string): FSCFixture[] {
  const q = clubName.toLowerCase();
  return fixtures
    .filter(f =>
      (f.homeTeam.name ?? '').toLowerCase().includes(q) ||
      (f.awayTeam.name ?? '').toLowerCase().includes(q)
    )
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate));
}

export type FixtureGroup = { dateKey: string; dayLabel: string; fixtures: FSCFixture[] };

export function groupByDate(fixtures: FSCFixture[]): FixtureGroup[] {
  const map = new Map<string, FSCFixture[]>();
  for (const f of fixtures) {
    const local = parseMatchDate(f.matchDate);
    const key = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => {
      const [y, m, d] = key.split('-').map(Number);
      return {
        dateKey: key,
        dayLabel: new Date(y, m - 1, d).toLocaleDateString('en-AU', {
          weekday: 'long', day: 'numeric', month: 'long',
        }),
        fixtures: group,
      };
    });
}
