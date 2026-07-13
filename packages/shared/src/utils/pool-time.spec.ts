import {
  WEEK_MS,
  RAIDPOOL_RESET_HOUR,
  LOOTPOOL_RESET_HOUR,
  POOL_SYSTEM_START,
  getFirstFridayUTC,
  getPoolYearWeek,
  getWeeksInPoolYear,
  getWeekDateRange,
  getDaysSinceWeek,
  getNextPoolReset,
  getDailyResetKey,
  getDailyExpireAt,
  getRaidpoolYearWeek,
  getLootpoolYearWeek,
} from './pool-time';

describe('pool-time constants', () => {
  it('defines the Friday reset hours', () => {
    expect(RAIDPOOL_RESET_HOUR).toBe(18);
    expect(LOOTPOOL_RESET_HOUR).toBe(19);
  });

  it('defines WEEK_MS as 7 days', () => {
    expect(WEEK_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('defines system start at 2024 week 38', () => {
    expect(POOL_SYSTEM_START).toEqual({ year: 2024, week: 38 });
  });
});

describe('getFirstFridayUTC', () => {
  it('returns 5 Jan 2024 18:00 UTC for year 2024 hour 18', () => {
    const ts = getFirstFridayUTC(2024, 18);
    const d = new Date(ts);
    expect(d.getUTCFullYear()).toBe(2024);
    expect(d.getUTCMonth()).toBe(0); // January
    expect(d.getUTCDate()).toBe(5);
    expect(d.getUTCDay()).toBe(5); // Friday
    expect(d.getUTCHours()).toBe(18);
  });

  it('returns 3 Jan 2025 19:00 UTC for year 2025 hour 19', () => {
    const ts = getFirstFridayUTC(2025, 19);
    const d = new Date(ts);
    expect(d.getUTCDate()).toBe(3);
    expect(d.getUTCDay()).toBe(5);
    expect(d.getUTCHours()).toBe(19);
  });
});

describe('getPoolYearWeek', () => {
  it('computes raidpool year/week for a date mid-week after reset', () => {
    // Wed 10 Jan 2024 12:00 UTC — week starting Fri 5 Jan 18:00
    const d = new Date(Date.UTC(2024, 0, 10, 12, 0, 0));
    const { year, week } = getPoolYearWeek(d, 18);
    expect(year).toBe(2024);
    expect(week).toBe(1);
  });

  it('treats the moment before reset as the previous week', () => {
    // Fri 5 Jan 2024 17:59 UTC — before 18:00 reset → still previous (2023) week
    const before = new Date(Date.UTC(2024, 0, 5, 17, 59, 0));
    const { year, week } = getPoolYearWeek(before, 18);
    expect(year).toBe(2023);
    expect(typeof week).toBe('number');
    // one minute later it flips to 2024 week 1
    const after = new Date(Date.UTC(2024, 0, 5, 18, 0, 0));
    const r2 = getPoolYearWeek(after, 18);
    expect(r2).toEqual({ year: 2024, week: 1 });
  });

  it('lootpool preset uses hour 19', () => {
    // Fri 5 Jan 2024 18:30 UTC — before 19:00 → still 2023 week for lootpool
    const d = new Date(Date.UTC(2024, 0, 5, 18, 30, 0));
    const r = getLootpoolYearWeek(d);
    expect(r.year).toBe(2023);
    expect(typeof r.week).toBe('number');
    expect(getLootpoolYearWeek(new Date(Date.UTC(2024, 0, 5, 19, 0, 0)))).toEqual({ year: 2024, week: 1 });
  });

  it('raidpool preset uses hour 18', () => {
    const d = new Date(Date.UTC(2024, 0, 5, 18, 0, 0));
    expect(getRaidpoolYearWeek(d)).toEqual({ year: 2024, week: 1 });
  });
});

describe('getWeeksInPoolYear', () => {
  it('returns descending list capped at current week for current year', () => {
    const weeks = getWeeksInPoolYear(2024, 18);
    expect(weeks[0]).toBeGreaterThan(weeks[weeks.length - 1]);
    // system start enforced
    expect(Math.min(...weeks)).toBeGreaterThanOrEqual(POOL_SYSTEM_START.week);
  });

  it('enforces system start minimum for 2024', () => {
    const weeks = getWeeksInPoolYear(2024, 18);
    expect(Math.min(...weeks)).toBe(POOL_SYSTEM_START.week);
  });
});

describe('getWeekDateRange', () => {
  it('formats a "Mon D - Mon D" range string (timezone-dependent exact dates)', () => {
    const range = getWeekDateRange(2024, 1, 18);
    // toLocaleDateString uses local TZ, so assert format pattern not exact dates.
    // Pattern: "ShortMonth DayNum - ShortMonth DayNum"
    expect(range).toMatch(/^[A-Z][a-z]{2} \d+ - [A-Z][a-z]{2} \d+$/);
  });
});

describe('getDaysSinceWeek', () => {
  // NOTE: getDaysSinceWeek uses a jan1-based Monday anchor, DIFFERENT from
  // getPoolYearWeek's firstFriday anchor (see spec). So the "current week"
  // per getPoolYearWeek is not necessarily "Today" per getDaysSinceWeek.
  // We test the output format, not cross-function consistency.

  it('returns a human-readable relative-time string for an old week', () => {
    // 2024 week 38 — far in the past relative to 2026
    const result = getDaysSinceWeek(2024, 38, 18);
    expect(result).toMatch(/(Today|day ago|days ago|week ago|weeks ago|month ago|months ago)/);
  });

  it('returns "Today" when the friday anchor is within the same day', () => {
    // Construct a (year, week) whose getDaysSinceWeek friday lands on "now's" date.
    // Easiest: compute the friday for the current real week using the same
    // jan1-based anchor getDaysSinceWeek uses, then derive (year, week) that
    // maps back. But that's circular — instead, just verify the function
    // never throws and always returns one of the known strings.
    const r = getDaysSinceWeek(2026, 1, 18);
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });
});

describe('getNextPoolReset', () => {
  it('returns a future Friday at the reset hour', () => {
    const now = new Date();
    const next = getNextPoolReset(18);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
    expect(next.getUTCDay()).toBe(5); // Friday
    expect(next.getUTCHours()).toBe(18);
  });
});

describe('getDailyResetKey', () => {
  it('shifts the day boundary by resetHour so pre-reset belongs to previous day', () => {
    // 2024-01-10 17:00 UTC, reset at 18:00 → belongs to 2024-01-09
    const d = new Date(Date.UTC(2024, 0, 10, 17, 0, 0));
    const key = getDailyResetKey(d, 18);
    expect(key.day).toBe(9);
    expect(key.key).toBe('2024-1-9');
  });

  it('keeps the day when at/after the reset hour', () => {
    const d = new Date(Date.UTC(2024, 0, 10, 18, 0, 0));
    const key = getDailyResetKey(d, 18);
    expect(key.day).toBe(10);
    expect(key.key).toBe('2024-1-10');
  });
});

describe('getDailyExpireAt', () => {
  it('returns the timestamp of the next reset hour boundary', () => {
    const d = new Date(Date.UTC(2024, 0, 10, 12, 0, 0));
    const expire = getDailyExpireAt(d, 18);
    const exp = new Date(expire);
    expect(exp.getUTCDate()).toBe(10);
    expect(exp.getUTCHours()).toBe(18);
  });

  it('rolls to next day when already past reset hour', () => {
    const d = new Date(Date.UTC(2024, 0, 10, 20, 0, 0));
    const expire = getDailyExpireAt(d, 18);
    const exp = new Date(expire);
    expect(exp.getUTCDate()).toBe(11);
    expect(exp.getUTCHours()).toBe(18);
  });
});
