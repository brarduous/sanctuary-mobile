export const IMPROVEMENT_CHECK_IN_DAYS = 30;
export const improvementReminderKey = (userId: string) => `improvement-check-in-next:${userId}`;
export function nextImprovementCheckInAt(now = new Date()) {
  const next = new Date(now.getTime() + IMPROVEMENT_CHECK_IN_DAYS * 24 * 60 * 60 * 1000);
  return next.toISOString();
}
export function isImprovementCheckInDue(profileDate?: string, localDate?: string | null, now = Date.now()) {
  const profileTime = profileDate ? Date.parse(profileDate) : NaN;
  if (!Number.isFinite(profileTime)) return false;
  const localTime = localDate ? Date.parse(localDate) : NaN;
  return Math.max(profileTime, Number.isFinite(localTime) ? localTime : 0) <= now;
}
