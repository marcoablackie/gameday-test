"use client";

type ScheduleItem = { time: string; type: string; activity: string };

let _timers: ReturnType<typeof setTimeout>[] = [];

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationPermitted(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

function parseHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

function minutesOfDay(hhmm: string): number {
  const { h, m } = parseHHMM(hhmm);
  return h * 60 + m;
}

function scheduleNotif(delayMs: number, title: string, body: string) {
  if (delayMs <= 0) return;
  const timer = setTimeout(() => {
    new Notification(title, { body, icon: '/favicon.ico', silent: false });
  }, delayMs);
  _timers.push(timer);
}

export function scheduleDayNotifications(
  schedule: ScheduleItem[],
  schoolStart = '08:00',
  schoolEnd = '15:00',
) {
  clearScheduledNotifications();
  if (!isNotificationPermitted()) return;

  const now = new Date();
  const schoolStartMins = minutesOfDay(schoolStart);
  const schoolEndMins = minutesOfDay(schoolEnd);

  // Morning briefing at 7:00am (skip if it's already past)
  const briefing = new Date();
  briefing.setHours(7, 0, 0, 0);
  if (briefing > now) {
    const trainingBlocks = schedule.filter(s => s.type === 'training');
    const nutritionBlocks = schedule.filter(s => s.type === 'nutrition');
    const body = `⚡ ${trainingBlocks.length} drill${trainingBlocks.length !== 1 ? 's' : ''}, ${nutritionBlocks.length} fuel block${nutritionBlocks.length !== 1 ? 's' : ''} on the plan. Get after it.`;
    scheduleNotif(briefing.getTime() - now.getTime(), 'Gameday Pro', body);
  }

  for (const item of schedule) {
    if (item.type !== 'training' && item.type !== 'nutrition') continue;

    const { h, m } = parseHHMM(item.time);
    const blockTime = new Date();
    blockTime.setHours(h, m, 0, 0);

    const label = item.type === 'nutrition'
      ? `🥗 ${item.activity}`
      : `⚡ ${item.activity}`;

    // 15-minute warning
    const warn15 = new Date(blockTime.getTime() - 15 * 60 * 1000);
    const warn15Mins = warn15.getHours() * 60 + warn15.getMinutes();
    const duringSchool = warn15Mins >= schoolStartMins && warn15Mins < schoolEndMins;
    if (warn15 > now && !duringSchool) {
      scheduleNotif(
        warn15.getTime() - now.getTime(),
        'Gameday Pro — 15 min',
        `${label} starts in 15 minutes`,
      );
    }

    // At-time reminder
    if (blockTime > now) {
      scheduleNotif(
        blockTime.getTime() - now.getTime(),
        'Gameday Pro — Now',
        `${label} — time to go`,
      );
    }
  }
}

export function clearScheduledNotifications() {
  _timers.forEach(t => clearTimeout(t));
  _timers = [];
}
