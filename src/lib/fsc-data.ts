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

const LS_KEY = 'gameday_fsc_data';
const LS_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function loadFSCData(): Promise<FSCData> {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) _promise = _load();
  return _promise;
}

async function _load(): Promise<FSCData> {
  // 1. Check localStorage (24h TTL)
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const { data, ts } = JSON.parse(stored);
      if (Date.now() - ts < LS_TTL) { _cache = data; return data; }
    }
  } catch {}

  // 2. Live proxy (Vercel caches 6h server-side, so this is fast after first hit)
  try {
    const res = await fetch('/api/fsc-fixtures');
    if (res.ok) {
      const data: FSCData = await res.json();
      _cache = data;
      try { localStorage.setItem(LS_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
      return data;
    }
  } catch {}

  // 3. Static bundled fallback
  const res = await fetch('/data/fsc_clean_season_database.json');
  const data: FSCData = await res.json();
  _cache = data;
  return data;
}

// ─── Date / time ────────────────────────────────────────────────────────────

const SYD = 'Australia/Sydney';

// Dribl returns local Sydney times without a timezone offset when called with
// timezone=Australia/Sydney — new Date() would misinterpret them as UTC.
// Detect missing offset and append the correct AEST/AEDT offset so all
// comparisons and formatting are correct.
export function parseMatchDate(isoString: string): Date {
  const s = isoString.replace(' ', 'T'); // handle "2026-05-24 09:30:00" format
  if (!s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
    // No timezone indicator — treat as Sydney local time
    const month = parseInt(s.slice(5, 7), 10);
    // AEDT (UTC+11): October–March; AEST (UTC+10): April–September
    const offset = (month >= 10 || month <= 3) ? '+11:00' : '+10:00';
    return new Date(s + offset);
  }
  return new Date(s);
}

export function formatDayHeader(date: Date): string {
  return date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: SYD });
}

export function formatKickoff(date: Date): string {
  return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: SYD });
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

// ─── Team discovery within a club ────────────────────────────────────────────

export type TeamEntry = { gradeKey: string; displayGrade: string; count: number };

export function teamsForClub(
  fixtures: FSCFixture[],
  clubName: string,
  allClubs: FSCClub[]
): TeamEntry[] {
  const q = clubName.toLowerCase();
  const countMap = new Map<string, number>();
  const displayMap = new Map<string, string>();

  for (const f of fixtures) {
    for (const team of [f.homeTeam, f.awayTeam]) {
      const name = team.name ?? '';
      if (!name.toLowerCase().startsWith(q)) continue;
      const { grade } = parseTeamName(name, allClubs);
      if (!grade) continue;
      // Normalise: strip trailing Male / Female for dedup key
      const key = grade.replace(/\s+(Male|Female)$/i, '').trim().toLowerCase();
      const display = grade.replace(/\s+(Male|Female)$/i, '').trim();
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
      if (!displayMap.has(key)) displayMap.set(key, display);
    }
  }

  return Array.from(countMap.entries())
    .map(([key, count]) => ({ gradeKey: key, displayGrade: displayMap.get(key) ?? key, count }))
    .sort((a, b) => a.displayGrade.localeCompare(b.displayGrade));
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

export function fixturesForTeam(
  fixtures: FSCFixture[],
  clubName: string,
  gradeKey: string,
  allClubs: FSCClub[]
): FSCFixture[] {
  const q = clubName.toLowerCase();
  return fixtures
    .filter(f => {
      for (const team of [f.homeTeam, f.awayTeam]) {
        const name = team.name ?? '';
        if (!name.toLowerCase().startsWith(q)) continue;
        const { grade } = parseTeamName(name, allClubs);
        const key = grade.replace(/\s+(Male|Female)$/i, '').trim().toLowerCase();
        if (key === gradeKey) return true;
      }
      return false;
    })
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate));
}

export type SavedTeam = {
  clubId: string;
  clubName: string;
  clubLogo: string;
  gradeKey: string;
  displayGrade: string;
};

export function getSavedTeam(): SavedTeam | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('gameday_my_team');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveTeam(team: SavedTeam) {
  try {
    localStorage.setItem('gameday_my_team', JSON.stringify(team));
    // Keep legacy key in sync so old code still works
    localStorage.setItem('gameday_my_club', JSON.stringify({ id: team.clubId, name: team.clubName, logo: team.clubLogo }));
  } catch {}
}

export type FixtureGroup = { dateKey: string; dayLabel: string; fixtures: FSCFixture[] };

export function groupByDate(fixtures: FSCFixture[]): FixtureGroup[] {
  const map = new Map<string, FSCFixture[]>();
  for (const f of fixtures) {
    // en-CA locale gives YYYY-MM-DD which is a stable sort key in Sydney time
    const key = new Date(f.matchDate).toLocaleDateString('en-CA', { timeZone: SYD });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => ({
      dateKey: key,
      dayLabel: new Date(key + 'T12:00:00').toLocaleDateString('en-AU', {
        weekday: 'long', day: 'numeric', month: 'long',
      }),
      fixtures: group,
    }));
}
