// Pure study-metric helpers — no React, no storage — so they're trivial to unit
// test and reuse. The user store owns the state; these compute the transitions.

/** A standard university term, in weeks — the denominator for semester progress. */
export const SEMESTER_WEEKS = 16;

const DAY_MS = 86_400_000;

/** Local calendar day as YYYY-MM-DD (not UTC — a streak is about the student's day). */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days between two YYYY-MM-DD keys (parsed at local midnight). */
export function dayDiff(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`).getTime();
  const to = new Date(`${toKey}T00:00:00`).getTime();
  return Math.round((to - from) / DAY_MS);
}

/**
 * The streak after a day of activity. Same day → unchanged; the very next day →
 * +1; any longer gap (or a first-ever visit) resets to 1. Returns null when the
 * student has already been counted today, so callers can skip a needless write.
 */
export function nextStreak(
  prev: { streak: number; lastActiveDate: string | null },
  today: string = todayKey(),
): { streak: number; lastActiveDate: string } | null {
  if (prev.lastActiveDate === today) return null;
  if (!prev.lastActiveDate) return { streak: 1, lastActiveDate: today };
  const gap = dayDiff(prev.lastActiveDate, today);
  const streak = gap === 1 ? prev.streak + 1 : 1;
  return { streak, lastActiveDate: today };
}

export type SemesterProgress = {
  percent: number;
  weeksDone: number;
  weeksTotal: number;
  encouragement: string;
};

function encourage(percent: number): string {
  if (percent <= 0) return "Let's get started!";
  if (percent < 34) return 'Off to a great start!';
  if (percent < 67) return 'Keep the momentum!';
  if (percent < 100) return 'Almost there!';
  return 'You made it! 🎉';
}

/**
 * How far into the term the student is, measured honestly from their first
 * launch over a {@link SEMESTER_WEEKS}-week term. A brand-new account reads 0%.
 */
export function deriveSemester(createdAt: string, now: number = Date.now()): SemesterProgress {
  const start = createdAt ? new Date(createdAt).getTime() : now;
  const elapsed = Number.isFinite(start) ? Math.floor((now - start) / (7 * DAY_MS)) : 0;
  const weeksDone = Math.max(0, Math.min(SEMESTER_WEEKS, elapsed));
  const percent = Math.round((weeksDone / SEMESTER_WEEKS) * 100);
  return { percent, weeksDone, weeksTotal: SEMESTER_WEEKS, encouragement: encourage(percent) };
}
