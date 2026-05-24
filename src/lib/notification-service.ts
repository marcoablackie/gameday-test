"use client";

type ScheduleItem = { time: string; type: string; activity: string };

let _timers: ReturnType<typeof setTimeout>[] = [];
let _swReg: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    _swReg = await navigator.serviceWorker.register('/sw.js');
  } catch {}
}

async function getSwReg(): Promise<ServiceWorkerRegistration | null> {
  if (_swReg) return _swReg;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    _swReg = await navigator.serviceWorker.ready;
    return _swReg;
  } catch { return null; }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  if (result === 'granted') await registerServiceWorker();
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

async function showNotif(title: string, body: string) {
  const reg = await getSwReg();
  if (reg) {
    reg.showNotification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
  } else if (typeof Notification !== 'undefined') {
    new Notification(title, { body, icon: '/icons/icon-192.png' });
  }
}

function scheduleNotif(delayMs: number, title: string, body: string) {
  if (delayMs <= 0) return;
  const timer = setTimeout(() => showNotif(title, body), delayMs);
  _timers.push(timer);
}

export async function notifyPlanReady(sport: string): Promise<void> {
  if (!isNotificationPermitted()) return;
  await showNotif('Gameday Pro', `Your ${sport} plan for today is loaded. Time to lock in. ⚡`);
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

  // 7am morning briefing
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

    const label = item.type === 'nutrition' ? `🥗 ${item.activity}` : `⚡ ${item.activity}`;

    const warn15 = new Date(blockTime.getTime() - 15 * 60 * 1000);
    const warn15Mins = warn15.getHours() * 60 + warn15.getMinutes();
    const duringSchool = warn15Mins >= schoolStartMins && warn15Mins < schoolEndMins;
    if (warn15 > now && !duringSchool) {
      scheduleNotif(warn15.getTime() - now.getTime(), 'Gameday Pro — 15 min', `${label} starts in 15 minutes`);
    }

    if (blockTime > now) {
      scheduleNotif(blockTime.getTime() - now.getTime(), 'Gameday Pro — Now', `${label} — time to go`);
    }
  }
}

export function clearScheduledNotifications() {
  _timers.forEach(t => clearTimeout(t));
  _timers = [];
}
