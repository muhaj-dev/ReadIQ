import type { AppIconName } from '@/components/ui/app-icon';

// Identity and the study stats now come from the real stores (see
// hooks/use-profile.ts). Only the account menu is static here — its rows link to
// features that land in later phases.

export type ProfileMenuTone = 'green' | 'blue' | 'orange' | 'slate' | 'purple';

export type ProfileStat = {
  value: string;
  label: string;
};

export type ProfileMenuItem = {
  id: string;
  icon: AppIconName;
  tone: ProfileMenuTone;
  title: string;
  subtitle?: string;
  /** Destination when tapped. Rows without one land in later phases. */
  href?: '/settings';
};

export const profile = {
  menu: [
    {
      id: 'study-sessions',
      icon: 'history-edu',
      tone: 'green',
      title: 'Study Sessions',
      subtitle: '25 completed',
    },
    {
      id: 'quiz-performance',
      icon: 'analytics',
      tone: 'blue',
      title: 'Quiz Performance',
      subtitle: 'Average 84%',
    },
    {
      id: 'achievements',
      icon: 'trophy',
      tone: 'orange',
      title: 'Achievements',
      subtitle: '12 unlocked',
    },
    { id: 'settings', icon: 'settings', tone: 'slate', title: 'Settings', href: '/settings' },
    { id: 'help', icon: 'help', tone: 'purple', title: 'Help & Support' },
  ] satisfies ProfileMenuItem[],
};
