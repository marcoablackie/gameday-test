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

  for (const item of schedule) {
    if (item.type !== 'training' && item.type !== 'nutrition') continue;

    const { h, m } = parseHHMM(item.time);
    const blockTime = new Date();
    blockTime.setHours(h, m, 0, 0);

    const alertTime = new Date(blockTime.getTime() - 15 * 60 * 1000);
    if (alertTime <= now) continue;

    const alertMins = alertTime.getHours() * 60 + alertTime.getMinutes();
    if (alertMins >= schoolStartMins && alertMins < schoolEndMins) continue;

    const body =
      item.type === 'nutrition'
        ? `🥗 ${item.activity} — fuel up in 15 mins`
        : `⚡ ${item.activity} starts in 15 mins`;

    const delay = alertTime.getTime() - now.getTime();
    const timer = setTimeout(() => {
      new Notification('Gameday Pro', { body, icon: '/favicon.ico', silent: false });
    }, delay);

    _timers.push(timer);
  }
}

export function clearScheduledNotifications() {
  _timers.forEach(t => clearTimeout(t));
  _timers = [];
}
