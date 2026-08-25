import { describe, expect, it, vi } from 'vitest';
import { getWeekBounds, isSameDay } from '@/lib/date';

describe('getWeekBounds', () => {
  it('returns Monday 00:00:00 to Sunday 23:59:59.999 for the current week', () => {
    // Wednesday, 2026-08-26, mid-day UTC — mid-week and far from any local-timezone
    // date rollover, so this is stable regardless of the machine's timezone.
    vi.setSystemTime(new Date('2026-08-26T12:00:00.000Z'));

    const { start, end } = getWeekBounds(0);

    expect(start.getDay()).toBe(1); // Monday
    expect(start.getDate()).toBe(24);
    expect([start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()]).toEqual([
      0, 0, 0, 0,
    ]);

    expect(end.getDay()).toBe(0); // Sunday
    expect(end.getDate()).toBe(30);
    expect([end.getHours(), end.getMinutes(), end.getSeconds(), end.getMilliseconds()]).toEqual([
      23, 59, 59, 999,
    ]);

    vi.useRealTimers();
  });

  it('returns the following week when offset is 1', () => {
    vi.setSystemTime(new Date('2026-08-26T12:00:00.000Z'));

    const { start, end } = getWeekBounds(1);

    expect(start.getDate()).toBe(31); // Monday, Aug 31
    expect(start.getMonth()).toBe(7); // August (0-indexed)
    expect(end.getDate()).toBe(6); // Sunday, Sep 6
    expect(end.getMonth()).toBe(8); // September

    vi.useRealTimers();
  });

  it('returns the previous week when offset is -1', () => {
    vi.setSystemTime(new Date('2026-08-26T12:00:00.000Z'));

    const { start, end } = getWeekBounds(-1);

    expect(start.getDate()).toBe(17); // Monday, Aug 17
    expect(end.getDate()).toBe(23); // Sunday, Aug 23

    vi.useRealTimers();
  });

  it('treats a Monday "now" as the start of its own week rather than rolling back', () => {
    // Monday itself is a week-boundary edge case worth pinning down explicitly.
    // Mid-day UTC avoids local-timezone date rollover on the test machine.
    vi.setSystemTime(new Date('2026-08-24T12:00:00.000Z'));

    const { start } = getWeekBounds(0);

    expect(start.getDate()).toBe(24);
    expect(start.getDay()).toBe(1);

    vi.useRealTimers();
  });

  it('treats a Sunday "now" as the end of the week that started the preceding Monday', () => {
    vi.setSystemTime(new Date('2026-08-30T12:00:00.000Z'));

    const { start, end } = getWeekBounds(0);

    expect(start.getDate()).toBe(24); // still the Monday that started this week
    expect(end.getDate()).toBe(30); // the Sunday "now" falls on
    expect(end.getDay()).toBe(0);

    vi.useRealTimers();
  });
});

describe('isSameDay', () => {
  it('returns true for two timestamps on the same calendar day at different times', () => {
    const morning = new Date('2026-08-26T01:00:00.000');
    const night = new Date('2026-08-26T23:45:00.000');

    expect(isSameDay(morning, night)).toBe(true);
  });

  it('returns false for two timestamps on different calendar days', () => {
    const day1 = new Date('2026-08-26T23:59:00.000');
    const day2 = new Date('2026-08-27T00:01:00.000');

    expect(isSameDay(day1, day2)).toBe(false);
  });

  it('returns false for the same day and month in different years', () => {
    const thisYear = new Date('2026-08-26T12:00:00.000');
    const nextYear = new Date('2027-08-26T12:00:00.000');

    expect(isSameDay(thisYear, nextYear)).toBe(false);
  });
});
