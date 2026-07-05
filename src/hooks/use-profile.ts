// Profile view-model — the identity block + the same real study stats the
// dashboard shows, sourced from the user + notes stores so the two screens agree.

import type { ProfileStat } from '@/data/profile';
import { useNotesStore } from '@/store/use-notes-store';
import { useUserStore } from '@/store/use-user-store';

export type ProfileModel = {
  user: { name: string; subtitle: string; role: string };
  stats: ProfileStat[];
};

/** "Computer Science" → "Computer Science Student"; already-a-role stays as typed. */
function roleFrom(studyingFor: string): string {
  const s = studyingFor.trim();
  if (!s) return 'Student';
  return /student/i.test(s) ? s : `${s} Student`;
}

export function useProfile(): ProfileModel {
  const profile = useUserStore((s) => s.profile);
  const noteCount = useNotesStore((s) => s.notes.length);

  return {
    user: {
      name: profile.name.trim() || 'Student',
      subtitle: profile.goal.trim(),
      role: roleFrom(profile.studyingFor),
    },
    stats: [
      { value: String(noteCount), label: 'Notes' },
      { value: String(profile.aiAnswers), label: 'AI Answers' },
      { value: String(profile.streak), label: 'Day Streak' },
    ],
  };
}
