// Pool time utilities — Friday-reset week math for raidpool/lootpool,
// plus daily-reset key helpers for gambits. All weekly functions are
// parameterized by resetHour; presets bind raidpool=18 / lootpool=19.

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const RAIDPOOL_RESET_HOUR = 18; // Friday 18:00 UTC
export const LOOTPOOL_RESET_HOUR = 19; // Friday 19:00 UTC
export const POOL_SYSTEM_START = { year: 2024, week: 38 };

// --- Core (parameterized) ---

export function getFirstFridayUTC(year: number, resetHour: number): number {
  const jan1 = new Date(Date.UTC(year, 0, 1, resetHour, 0, 0));
  const day = jan1.getUTCDay(); // 0=Sun ... 5=Fri
  const diffToFriday = (5 - day + 7) % 7;
  jan1.setUTCDate(jan1.getUTCDate() + diffToFriday);
  return jan1.getTime();
}

export function getPoolYearWeek(date: Date, resetHour: number): { year: number; week: number } {
  const REFERENCE_FRIDAY_UTC = Date.UTC(2024, 0, 5, resetHour, 0, 0);
  const diffWeeks = Math.floor((date.getTime() - REFERENCE_FRIDAY_UTC) / WEEK_MS);
  const weekStart = REFERENCE_FRIDAY_UTC + diffWeeks * WEEK_MS;
  const weekDate = new Date(weekStart);
  const year = weekDate.getUTCFullYear();
  const firstFriday = getFirstFridayUTC(year, resetHour);
  const week = Math.floor((weekStart - firstFriday) / WEEK_MS) + 1;
  return { year, week };
}

export function getWeeksInPoolYear(year: number, resetHour: number): number[] {
  const firstFriday = getFirstFridayUTC(year, resetHour);
  const nextYearFirstFriday = getFirstFridayUTC(year + 1, resetHour);
  const totalWeeks = Math.floor((nextYearFirstFriday - firstFriday) / WEEK_MS);
  const { year: currentYear, week: currentWeek } = getPoolYearWeek(new Date(), resetHour);

  let minWeek = 1;
  let maxWeek = year === currentYear ? currentWeek : totalWeeks;

  // enforce system start
  if (year === POOL_SYSTEM_START.year) {
    minWeek = POOL_SYSTEM_START.week;
  }
  if (maxWeek < minWeek) return [];

  return Array.from({ length: maxWeek - minWeek + 1 }, (_, i) => maxWeek - i);
}

export function getWeekDateRange(year: number, week: number, resetHour: number): string {
  const firstFriday = getFirstFridayUTC(year, resetHour);
  const weekStart = new Date(firstFriday + (week - 1) * WEEK_MS);
  const weekEnd = new Date(weekStart.getTime() + WEEK_MS - 1);
  const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${format(weekStart)} - ${format(weekEnd)}`;
}

export function getDaysSinceWeek(year: number, week: number, resetHour: number): string {
  // IMPORTANT: preserved verbatim from the original getDaysAgo — uses a
  // jan1-based Monday-week anchor, NOT getFirstFridayUTC. Do not "unify".
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const daysToAdd = (week - 1) * 7 - ((jan1.getUTCDay() + 6) % 7);
  const weekStart = new Date(jan1);
  weekStart.setUTCDate(jan1.getUTCDate() + daysToAdd);

  const friday = new Date(weekStart);
  friday.setUTCDate(weekStart.getUTCDate() + ((5 - weekStart.getUTCDay() + 7) % 7));
  friday.setUTCHours(resetHour, 0, 0, 0);

  const now = new Date();
  const diff = now.getTime() - friday.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.floor(days / 30)} months ago`;
}

export function getNextPoolReset(resetHour: number): Date {
  const now = new Date();
  const nextFriday = new Date();
  const currentDay = now.getUTCDay();
  const currentHour = now.getUTCHours();
  let daysUntilFriday = (5 - currentDay + 7) % 7;
  if (currentDay === 5 && currentHour >= resetHour) {
    daysUntilFriday = 7;
  }
  nextFriday.setUTCDate(now.getUTCDate() + daysUntilFriday);
  nextFriday.setUTCHours(resetHour, 0, 0, 0);
  return nextFriday;
}

// --- Daily reset (gambits) ---

export function getDailyResetKey(date: Date, resetHour: number): { year: number; month: number; day: number; key: string } {
  const adjusted = new Date(date.getTime() - resetHour * 60 * 60 * 1000);
  const year = adjusted.getUTCFullYear();
  const month = adjusted.getUTCMonth() + 1; // 1-12
  const day = adjusted.getUTCDate();
  const key = `${year}-${month}-${day}`;
  return { year, month, day, key };
}

export function getDailyExpireAt(date: Date, resetHour: number): number {
  const adjusted = new Date(date.getTime() - resetHour * 60 * 60 * 1000);
  adjusted.setUTCDate(adjusted.getUTCDate() + 1);
  adjusted.setUTCHours(resetHour, 0, 0, 0);
  return adjusted.getTime();
}

// --- Raidpool presets (hour 18) ---

export const getRaidpoolYearWeek = (date: Date) => getPoolYearWeek(date, RAIDPOOL_RESET_HOUR);
export const getFirstRaidpoolFridayUTC = (year: number) => getFirstFridayUTC(year, RAIDPOOL_RESET_HOUR);
export const getWeeksInRaidpoolYear = (year: number) => getWeeksInPoolYear(year, RAIDPOOL_RESET_HOUR);
export const getRaidpoolWeekDateRange = (y: number, w: number) => getWeekDateRange(y, w, RAIDPOOL_RESET_HOUR);
export const getDaysSinceRaidpoolWeek = (y: number, w: number) => getDaysSinceWeek(y, w, RAIDPOOL_RESET_HOUR);
export const getNextRaidpoolReset = () => getNextPoolReset(RAIDPOOL_RESET_HOUR);

// --- Lootpool presets (hour 19) ---

export const getLootpoolYearWeek = (date: Date) => getPoolYearWeek(date, LOOTPOOL_RESET_HOUR);
export const getFirstLootpoolFridayUTC = (year: number) => getFirstFridayUTC(year, LOOTPOOL_RESET_HOUR);
export const getWeeksInLootpoolYear = (year: number) => getWeeksInPoolYear(year, LOOTPOOL_RESET_HOUR);
export const getLootpoolWeekDateRange = (y: number, w: number) => getWeekDateRange(y, w, LOOTPOOL_RESET_HOUR);
export const getDaysSinceLootpoolWeek = (y: number, w: number) => getDaysSinceWeek(y, w, LOOTPOOL_RESET_HOUR);
export const getNextLootpoolReset = () => getNextPoolReset(LOOTPOOL_RESET_HOUR);
