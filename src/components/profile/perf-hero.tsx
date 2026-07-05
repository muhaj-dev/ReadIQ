import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  averagePercent: number;
  bestPercent: number;
  encouragement: string;
};

// r ≈ 15.9155 in a 36×36 box → circumference ≈ 100, so dasharray is "percent, 100".
const RING_PATH =
  'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';

/** The indigo hero: a ring of the student's average quiz score + best-score line. */
export function PerfHero({ averagePercent, bestPercent, encouragement }: Props) {
  const colors = useTheme();
  const onCard = colors.onPrimary;

  return (
    <View
      className="overflow-hidden rounded-card p-6"
      style={[styles.card, { backgroundColor: colors.primaryContainer, shadowColor: colors.shadow }]}>
      <View
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full"
        style={{ backgroundColor: withAlpha(onCard, 0.05) }}
      />
      <View
        className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full"
        style={{ backgroundColor: withAlpha(onCard, 0.1) }}
      />

      <View className="flex-row items-center gap-4">
        <View className="h-24 w-24 items-center justify-center">
          <Svg width="100%" height="100%" viewBox="0 0 36 36">
            <Path d={RING_PATH} fill="none" stroke={withAlpha(onCard, 0.2)} strokeWidth={3} />
            <Path
              d={RING_PATH}
              fill="none"
              stroke={onCard}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={`${averagePercent}, 100`}
            />
          </Svg>
          <Text className="absolute" style={[styles.count, { color: onCard }]}>
            {averagePercent}%
          </Text>
        </View>

        <View className="flex-1">
          <Text className="mb-1" style={[styles.title, { color: onCard }]}>
            Average Score
          </Text>
          <View className="flex-row items-center gap-2">
            <AppIcon name="trending-up" size={14} color={withAlpha(onCard, 0.7)} />
            <Text style={[styles.meta, { color: withAlpha(onCard, 0.9) }]}>
              Best {bestPercent}%
            </Text>
          </View>
          <Text className="mt-1" style={[styles.meta, { color: withAlpha(onCard, 0.7) }]}>
            {encouragement}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  count: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.headingBold,
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: fonts.bodySemibold,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
});
