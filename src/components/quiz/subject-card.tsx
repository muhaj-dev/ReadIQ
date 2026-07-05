import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { QuizSubject, QuizSubjectTone } from '@/data/quiz-subjects';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  subject: QuizSubject;
  onPress: () => void;
};

// Tone drives the icon well + icon colour, reusing the memory-panel note tints.
function toneStyles(tone: QuizSubjectTone, colors: ColorTokens) {
  if (tone === 'green') return { wellBg: colors.noteGreenWell, iconColor: colors.noteGreen };
  if (tone === 'amber') return { wellBg: colors.noteAmberWell, iconColor: colors.noteAmber };
  return { wellBg: colors.surfaceContainer, iconColor: colors.primary };
}

/** One pickable subject on the Quiz Home screen — tap to start that quiz. */
export function SubjectCard({ subject, onPress }: Props) {
  const colors = useTheme();
  const tone = toneStyles(subject.tone, colors);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      className="w-full flex-row items-center justify-between rounded-card p-4"
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: colors.surfaceLow,
          shadowColor: colors.shadow,
        },
      ]}>
      <View className="flex-1 flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: tone.wellBg }}>
          <AppIcon name={subject.icon} size={24} color={tone.iconColor} />
        </View>
        <View className="flex-1">
          <Text style={[styles.title, { color: colors.onSurface }]}>{subject.name}</Text>
          <Text className="mt-0.5" style={[styles.blurb, { color: colors.onSurfaceVariant }]}>
            {subject.blurb}
          </Text>
          <Text className="mt-1" style={[styles.count, { color: colors.secondary }]}>
            {subject.count} questions
          </Text>
        </View>
      </View>
      <AppIcon name="chevron-right" size={24} color={withAlpha(colors.onSurfaceVariant, 0.6)} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodySemibold,
  },
  blurb: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
  count: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodySemibold,
  },
});
