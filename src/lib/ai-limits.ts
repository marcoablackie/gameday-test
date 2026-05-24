export type AIFeature = 'scout' | 'snack' | 'food-scan' | 'plan-refresh';

export const FREE_LIMITS: Record<AIFeature, { max: number; daily: boolean; label: string }> = {
  scout:          { max: 3,  daily: false, label: 'scout reports' },
  snack:          { max: 3,  daily: true,  label: 'snack suggestions' },
  'food-scan':    { max: 5,  daily: true,  label: 'food scans' },
  'plan-refresh': { max: 2,  daily: true,  label: 'plan refreshes' },
};

function storageKey(feature: AIFeature): string {
  const config = FREE_LIMITS[feature];
  if (!config.daily) return `gameday_ai_${feature}_total`;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  return `gameday_ai_${feature}_${today}`;
}

export function getAIUsed(feature: AIFeature): number {
  try { return parseInt(localStorage.getItem(storageKey(feature)) ?? '0', 10) || 0; }
  catch { return 0; }
}

export function incrementAI(feature: AIFeature): void {
  try {
    const key = storageKey(feature);
    localStorage.setItem(key, String((parseInt(localStorage.getItem(key) ?? '0', 10) || 0) + 1));
  } catch {}
}

export function aiLimit(feature: AIFeature, hasAccess: boolean): {
  allowed: boolean; used: number; max: number; remaining: number; label: string;
} {
  const config = FREE_LIMITS[feature];
  if (hasAccess) return { allowed: true, used: 0, max: 999, remaining: 999, label: config.label };
  const used = getAIUsed(feature);
  const remaining = Math.max(0, config.max - used);
  return { allowed: remaining > 0, used, max: config.max, remaining, label: config.label };
}
