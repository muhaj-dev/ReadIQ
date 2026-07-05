// The dashboard view-model — turns the real stores (user + notes) into the
// shapes the home cards render. Keeps the screen thin (compose only) and puts
// the "what counts as real data yet" decisions in one honest place.

import type { DashboardDeadline, DashboardStat, WeakTopic } from '@/data/dashboard';
import { deriveSemester, type SemesterProgress } from '@/lib/study-stats';
import { useNotesStore } from '@/store/use-notes-store';
import { useUserStore } from '@/store/use-user-store';

export type DashboardModel = {
  user: { name: string; streakDays: number };
  semester: SemesterProgress;
  stats: DashboardStat[];
  /** Empty until the deadlines store lands (Phase 7) — the UI shows a hint. */
  deadlines: DashboardDeadline[];
  /** Empty until quizzes surface weak topics (Phase 6) — the UI shows a hint. */
  weakTopics: WeakTopic[];
};

export function useDashboard(): DashboardModel {
  const profile = useUserStore((s) => s.profile);
  const noteCount = useNotesStore((s) => s.notes.length);

  const stats: DashboardStat[] = [
    { value: String(noteCount), label: 'Notes', tone: 'primary' },
    { value: String(profile.aiAnswers), label: 'AI Answers', tone: 'secondary' },
    // Quiz scoring arrives in Phase 6 — an honest dash until then.
    { value: '—', label: 'Quiz Score', tone: 'deep' },
  ];

  return {
    user: { name: profile.name.trim() || 'there', streakDays: profile.streak },
    semester: deriveSemester(profile.createdAt),
    stats,
    deadlines: [],
    weakTopics: [],
  };
}
