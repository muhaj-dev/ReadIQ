import type { AppIconName } from '@/components/ui/app-icon';

import { quizQuestions } from './quiz-questions';

// The subjects a student can pick before starting a quiz. Counts are derived
// from quizQuestions so the "N questions" line is always honest — when real
// note-generated quizzes land (lib/quizgen.ts) this list becomes dynamic.

/** Icon-well tone for a subject card (mapped to theme tokens in the component). */
export type QuizSubjectTone = 'indigo' | 'green' | 'amber';

export type QuizSubject = {
  /** 'mixed' quizzes every subject; otherwise the value matches question.subject. */
  key: string;
  name: string;
  blurb: string;
  icon: AppIconName;
  tone: QuizSubjectTone;
  /** Number of questions available for this subject. */
  count: number;
};

const countFor = (subject: string) =>
  quizQuestions.filter((question) => question.subject === subject).length;

export const quizSubjects: QuizSubject[] = [
  {
    key: 'mixed',
    name: 'Mixed quiz',
    blurb: 'A little of everything you’ve saved',
    icon: 'auto-awesome',
    tone: 'indigo',
    count: quizQuestions.length,
  },
  {
    key: 'Cell Biology',
    name: 'Cell Biology',
    blurb: 'Organelles, DNA & cell division',
    icon: 'psychology',
    tone: 'green',
    count: countFor('Cell Biology'),
  },
  {
    key: 'Photosynthesis',
    name: 'Photosynthesis',
    blurb: 'Light reactions & the Calvin cycle',
    icon: 'psychology',
    tone: 'amber',
    count: countFor('Photosynthesis'),
  },
  {
    key: 'Algorithms',
    name: 'Algorithms',
    blurb: 'Big O, recursion & complexity',
    icon: 'quiz',
    tone: 'indigo',
    count: countFor('Algorithms'),
  },
];
