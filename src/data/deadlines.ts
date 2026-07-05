// Static Deadlines content matching the design mocks. Real values arrive with
// useDeadlinesStore + SQLite in a later pass — the screens are UI-first, like
// the dashboard and memory panel.

import type { SheetOption } from '@/components/form/option-sheet';

export type DeadlineUrgency = 'today' | 'soon' | 'later';

export type UpcomingDeadline = {
  id: string;
  title: string;
  /** "May 20, 2026 • 11:59 PM" */
  when: string;
  /** "Due today" / "1 day left" / "3 days left" */
  status: string;
  urgency: DeadlineUrgency;
};

export type CalendarCell = {
  day: number;
  /** Adjacent-month days render dimmed (opacity 30% in the mock). */
  inMonth: boolean;
};

/** Full 7-column grid for a month, padded with adjacent-month days. */
export function buildMonthCells(year: number, monthIndex: number): CalendarCell[] {
  const leading = new Date(year, monthIndex, 1).getDay(); // Sunday-first
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrev = new Date(year, monthIndex, 0).getDate();
  const total = Math.ceil((leading + daysInMonth) / 7) * 7;

  return Array.from({ length: total }, (_, i) => {
    if (i < leading) return { day: daysInPrev - leading + 1 + i, inMonth: false };
    if (i < leading + daysInMonth) return { day: i - leading + 1, inMonth: true };
    return { day: i - leading - daysInMonth + 1, inMonth: false };
  });
}

export const deadlinesMonth = {
  label: 'May 2026',
  year: 2026,
  monthIndex: 4,
  selectedDay: 20,
};

export const upcomingDeadlines: UpcomingDeadline[] = [
  {
    id: 'physics-lab',
    title: 'Physics Lab Report',
    when: 'May 20, 2026 • 11:59 PM',
    status: 'Due today',
    urgency: 'today',
  },
  {
    id: 'calculus-quiz',
    title: 'Calculus Quiz',
    when: 'May 21, 2026 • 10:00 AM',
    status: '1 day left',
    urgency: 'soon',
  },
  {
    id: 'algorithms-assignment',
    title: 'Algorithms Assignment',
    when: 'May 23, 2026 • 11:59 PM',
    status: '3 days left',
    urgency: 'later',
  },
];

// ── Add Deadline form ──

export type DeadlineDraft = {
  title: string;
  subject: string;
  type: string;
  date: string;
  time: string;
  reminder: string;
  repeat: string;
  notes: string;
  /** Index into DeadlineMarkers (constants/theme.ts). */
  colorIndex: number;
};

/** Seeded with the mock's values until useDeadlinesStore lands. */
export const initialDraft: DeadlineDraft = {
  title: 'Biochemistry Exam',
  subject: 'Biochemistry',
  type: 'Exam',
  date: 'May 28, 2026',
  time: '09:00 AM',
  reminder: '1 day before',
  repeat: "Don't repeat",
  notes: 'Bring calculator and formula sheet',
  colorIndex: 5,
};

export const pickerOptions: Record<'subject' | 'type' | 'reminder' | 'repeat', SheetOption[]> = {
  subject: [
    { label: 'Biochemistry' },
    { label: 'Physics' },
    { label: 'Calculus' },
    { label: 'Algorithms' },
    { label: 'Cell Biology' },
  ],
  type: [
    { label: 'Exam' },
    { label: 'Quiz' },
    { label: 'Assignment' },
    { label: 'Lab Report' },
    { label: 'Project' },
  ],
  reminder: [
    { label: 'No reminder' },
    { label: 'At time of event' },
    { label: '5 minutes before' },
    { label: '15 minutes before' },
    { label: '1 hour before' },
    { label: '1 day before' },
    { label: '2 days before' },
    { label: '1 week before' },
    { label: 'Custom', chevron: true },
  ],
  repeat: [
    { label: "Don't repeat" },
    { label: 'Daily' },
    { label: 'Weekly' },
    { label: 'Monthly' },
  ],
};
