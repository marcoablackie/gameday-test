export type GlobalClub = { id: string; name: string };
export type GlobalLeague = { id: string; name: string; country: string; flag: string; sport?: string; clubs: GlobalClub[] };

export const GLOBAL_LEAGUES: GlobalLeague[] = [
  {
    id: 'epl', name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    clubs: [
      { id: 'arsenal', name: 'Arsenal' },
      { id: 'chelsea', name: 'Chelsea' },
      { id: 'liverpool', name: 'Liverpool' },
      { id: 'mancity', name: 'Manchester City' },
      { id: 'manutd', name: 'Manchester United' },
      { id: 'spurs', name: 'Tottenham Hotspur' },
      { id: 'newcastle', name: 'Newcastle United' },
      { id: 'aston_villa', name: 'Aston Villa' },
      { id: 'west_ham', name: 'West Ham United' },
      { id: 'brighton', name: 'Brighton & Hove Albion' },
    ],
  },
  {
    id: 'laliga', name: 'La Liga', country: 'Spain', flag: '🇪🇸',
    clubs: [
      { id: 'real_madrid', name: 'Real Madrid' },
      { id: 'barcelona', name: 'FC Barcelona' },
      { id: 'atletico', name: 'Atlético Madrid' },
      { id: 'sevilla', name: 'Sevilla FC' },
      { id: 'real_betis', name: 'Real Betis' },
      { id: 'real_sociedad', name: 'Real Sociedad' },
      { id: 'villarreal', name: 'Villarreal CF' },
      { id: 'athletic_bilbao', name: 'Athletic Club' },
    ],
  },
  {
    id: 'seriea', name: 'Serie A', country: 'Italy', flag: '🇮🇹',
    clubs: [
      { id: 'juventus', name: 'Juventus' },
      { id: 'acmilan', name: 'AC Milan' },
      { id: 'inter', name: 'Inter Milan' },
      { id: 'napoli', name: 'SSC Napoli' },
      { id: 'roma', name: 'AS Roma' },
      { id: 'lazio', name: 'SS Lazio' },
      { id: 'atalanta', name: 'Atalanta BC' },
      { id: 'fiorentina', name: 'Fiorentina' },
    ],
  },
  {
    id: 'bundesliga', name: 'Bundesliga', country: 'Germany', flag: '🇩🇪',
    clubs: [
      { id: 'bayern', name: 'Bayern Munich' },
      { id: 'dortmund', name: 'Borussia Dortmund' },
      { id: 'rbleipzig', name: 'RB Leipzig' },
      { id: 'leverkusen', name: 'Bayer Leverkusen' },
      { id: 'frankfurt', name: 'Eintracht Frankfurt' },
      { id: 'wolfsburg', name: 'VfL Wolfsburg' },
      { id: 'gladbach', name: 'Borussia Mönchengladbach' },
      { id: 'werder', name: 'Werder Bremen' },
    ],
  },
  {
    id: 'ligue1', name: 'Ligue 1', country: 'France', flag: '🇫🇷',
    clubs: [
      { id: 'psg', name: 'Paris Saint-Germain' },
      { id: 'marseille', name: 'Olympique de Marseille' },
      { id: 'lyon', name: 'Olympique Lyonnais' },
      { id: 'monaco', name: 'AS Monaco' },
      { id: 'lille', name: 'LOSC Lille' },
      { id: 'nice', name: 'OGC Nice' },
      { id: 'lens', name: 'RC Lens' },
      { id: 'rennes', name: 'Stade Rennais' },
    ],
  },
  {
    id: 'mls', name: 'MLS', country: 'United States', flag: '🇺🇸',
    clubs: [
      { id: 'lagalaxy', name: 'LA Galaxy' },
      { id: 'lafc', name: 'LAFC' },
      { id: 'nyrb', name: 'New York Red Bulls' },
      { id: 'nycfc', name: 'New York City FC' },
      { id: 'atlanta', name: 'Atlanta United' },
      { id: 'seattle', name: 'Seattle Sounders' },
      { id: 'portland', name: 'Portland Timbers' },
      { id: 'miami', name: 'Inter Miami CF' },
    ],
  },
  {
    id: 'aleague', name: 'A-League', country: 'Australia', flag: '🇦🇺', sport: 'Soccer',
    clubs: [
      { id: 'melb_city', name: 'Melbourne City' },
      { id: 'melb_victory', name: 'Melbourne Victory' },
      { id: 'sydney_fc', name: 'Sydney FC' },
      { id: 'wsw', name: 'Western Sydney Wanderers' },
      { id: 'brisbane', name: 'Brisbane Roar' },
      { id: 'perth', name: 'Perth Glory' },
      { id: 'mariners', name: 'Central Coast Mariners' },
      { id: 'adelaide', name: 'Adelaide United' },
    ],
  },
  // ── AFL ──────────────────────────────────────────────────────────────────
  {
    id: 'afl', name: 'AFL', country: 'Australia', flag: '🇦🇺', sport: 'AFL',
    clubs: [
      { id: 'adelaidecrows', name: 'Adelaide Crows' },
      { id: 'brisbanelions', name: 'Brisbane Lions' },
      { id: 'carlton', name: 'Carlton' },
      { id: 'collingwood', name: 'Collingwood' },
      { id: 'essendon', name: 'Essendon' },
      { id: 'fremantle', name: 'Fremantle' },
      { id: 'geelong', name: 'Geelong Cats' },
      { id: 'goldcoastsuns', name: 'Gold Coast Suns' },
      { id: 'gwssydney', name: 'GWS Giants' },
      { id: 'hawthorn', name: 'Hawthorn' },
      { id: 'melbournefc', name: 'Melbourne' },
      { id: 'northmelbourne', name: 'North Melbourne' },
      { id: 'portadelaide', name: 'Port Adelaide' },
      { id: 'richmond', name: 'Richmond' },
      { id: 'stkilda', name: 'St Kilda' },
      { id: 'sydneyswans', name: 'Sydney Swans' },
      { id: 'westcoasteagles', name: 'West Coast Eagles' },
      { id: 'westernbulldogs', name: 'Western Bulldogs' },
    ],
  },
  // ── NRL ──────────────────────────────────────────────────────────────────
  {
    id: 'nrl', name: 'NRL', country: 'Australia', flag: '🇦🇺', sport: 'Rugby League',
    clubs: [
      { id: 'broncos', name: 'Brisbane Broncos' },
      { id: 'bulldogs', name: 'Canterbury Bulldogs' },
      { id: 'cowboys', name: 'North Queensland Cowboys' },
      { id: 'dolphins', name: 'Dolphins' },
      { id: 'dragons', name: 'St George Illawarra Dragons' },
      { id: 'eels', name: 'Parramatta Eels' },
      { id: 'knights', name: 'Newcastle Knights' },
      { id: 'panthers', name: 'Penrith Panthers' },
      { id: 'rabbitos', name: 'South Sydney Rabbitohs' },
      { id: 'raiders', name: 'Canberra Raiders' },
      { id: 'roosters', name: 'Sydney Roosters' },
      { id: 'sea_eagles', name: 'Manly Sea Eagles' },
      { id: 'sharks', name: 'Cronulla Sharks' },
      { id: 'storm', name: 'Melbourne Storm' },
      { id: 'tigers', name: 'Wests Tigers' },
      { id: 'titans', name: 'Gold Coast Titans' },
      { id: 'warriors', name: 'New Zealand Warriors' },
    ],
  },
  // ── NBL ──────────────────────────────────────────────────────────────────
  {
    id: 'nbl', name: 'NBL', country: 'Australia', flag: '🇦🇺', sport: 'Basketball',
    clubs: [
      { id: 'adelaide36ers', name: 'Adelaide 36ers' },
      { id: 'brisbanebullets', name: 'Brisbane Bullets' },
      { id: 'caimssnipas', name: 'Cairns Taipans' },
      { id: 'illawarra', name: 'Illawarra Hawks' },
      { id: 'melb_united', name: 'Melbourne United' },
      { id: 'nz_breakers', name: 'New Zealand Breakers' },
      { id: 'perth_wildcats', name: 'Perth Wildcats' },
      { id: 'se_phoenix', name: 'South East Melbourne Phoenix' },
      { id: 'sydney_kings', name: 'Sydney Kings' },
    ],
  },
  // ── NBA ──────────────────────────────────────────────────────────────────
  {
    id: 'nba', name: 'NBA', country: 'United States', flag: '🇺🇸', sport: 'Basketball',
    clubs: [
      { id: 'lakers', name: 'Los Angeles Lakers' },
      { id: 'warriors', name: 'Golden State Warriors' },
      { id: 'celtics', name: 'Boston Celtics' },
      { id: 'heat', name: 'Miami Heat' },
      { id: 'bulls', name: 'Chicago Bulls' },
      { id: 'nets', name: 'Brooklyn Nets' },
      { id: 'knicks', name: 'New York Knicks' },
      { id: 'bucks', name: 'Milwaukee Bucks' },
      { id: 'nuggets', name: 'Denver Nuggets' },
      { id: 'suns', name: 'Phoenix Suns' },
    ],
  },
  // ── Super Rugby ──────────────────────────────────────────────────────────
  {
    id: 'superrugby', name: 'Super Rugby Pacific', country: 'Australia', flag: '🇦🇺', sport: 'Rugby Union',
    clubs: [
      { id: 'brumbies', name: 'Brumbies' },
      { id: 'reds', name: 'Queensland Reds' },
      { id: 'rebels', name: 'Melbourne Rebels' },
      { id: 'waratahs', name: 'NSW Waratahs' },
      { id: 'forceau', name: 'Western Force' },
    ],
  },
  // ── Super Netball ─────────────────────────────────────────────────────────
  {
    id: 'supernetball', name: 'Super Netball', country: 'Australia', flag: '🇦🇺', sport: 'Netball',
    clubs: [
      { id: 'adelaidethunderbirds', name: 'Adelaide Thunderbirds' },
      { id: 'collingwoodmagpies', name: 'Collingwood Magpies' },
      { id: 'giantnetball', name: 'Giants Netball' },
      { id: 'melb_vixens', name: 'Melbourne Vixens' },
      { id: 'nswswifts', name: 'NSW Swifts' },
      { id: 'qld_firebirds', name: 'Queensland Firebirds' },
      { id: 'sunshine_coast', name: 'Sunshine Coast Lightning' },
      { id: 'west_coast_fever', name: 'West Coast Fever' },
    ],
  },
];

export const COUNTRIES = [...new Set(GLOBAL_LEAGUES.map(l => l.country))];

export function leaguesForCountry(country: string): GlobalLeague[] {
  return GLOBAL_LEAGUES.filter(l => l.country === country);
}

export function leagueById(id: string): GlobalLeague | undefined {
  return GLOBAL_LEAGUES.find(l => l.id === id);
}
