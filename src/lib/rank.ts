export type Rank = { name: string; minXP: number; color: string; bg: string };

export const RANKS: Rank[] = [
  { name: 'Rookie',  minXP: 0,    color: 'text-white/50',    bg: 'bg-white/5'        },
  { name: 'Grinder', minXP: 300,  color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  { name: 'Athlete', minXP: 750,  color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
  { name: 'Pro',     minXP: 1500, color: 'text-orange-400',  bg: 'bg-orange-500/10'  },
  { name: 'Elite',   minXP: 3000, color: 'text-yellow-400',  bg: 'bg-yellow-500/10'  },
  { name: 'Legend',  minXP: 6000, color: 'text-red-400',     bg: 'bg-red-500/10'     },
];

export function getRank(xp: number): Rank {
  return [...RANKS].reverse().find(r => xp >= r.minXP) ?? RANKS[0];
}

export function getNextRank(xp: number): Rank | null {
  const current = getRank(xp);
  const idx = RANKS.indexOf(current);
  return RANKS[idx + 1] ?? null;
}

export function getRankProgress(xp: number): number {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 100;
  return Math.min(100, Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100));
}
