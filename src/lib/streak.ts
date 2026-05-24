const key = (uid: string) => `gameday_streak_${uid}`;

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
}

export type StreakData = { count: number; lastDate: string };

export function getStreak(uid: string): StreakData {
  try {
    const s = localStorage.getItem(key(uid));
    return s ? (JSON.parse(s) as StreakData) : { count: 0, lastDate: '' };
  } catch { return { count: 0, lastDate: '' }; }
}

export function touchStreak(uid: string): StreakData {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const cur = getStreak(uid);

  let next: StreakData;
  if (cur.lastDate === today) {
    next = cur;
  } else if (cur.lastDate === yesterday) {
    next = { count: cur.count + 1, lastDate: today };
  } else {
    next = { count: 1, lastDate: today };
  }

  try { localStorage.setItem(key(uid), JSON.stringify(next)); } catch {}
  return next;
}
