export type GlobalClub = { id: string; name: string };
export type GlobalLeague = { id: string; name: string; country: string; flag: string; clubs: GlobalClub[] };

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
    id: 'aleague', name: 'A-League', country: 'Australia', flag: '🇦🇺',
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
];

export const COUNTRIES = [...new Set(GLOBAL_LEAGUES.map(l => l.country))];

export function leaguesForCountry(country: string): GlobalLeague[] {
  return GLOBAL_LEAGUES.filter(l => l.country === country);
}

export function leagueById(id: string): GlobalLeague | undefined {
  return GLOBAL_LEAGUES.find(l => l.id === id);
}
