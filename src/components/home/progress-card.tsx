import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  percent: number;
  weeksDone: number;
  weeksTotal: number;
  encouragement: string;
};

// Circle of radius 15.9155 in a 36×36 viewBox → circumference ≈ 100, so the
// dash array can be "percent, 100" (same trick as the design mock).
const RING_PATH =
  'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831';

/** The indigo "Semester Progress" hero card with its ring gauge. */
export function ProgressCard({ percent, weeksDone, weeksTotal, encouragement }: Props) {
  const colors = useTheme();
  const onCard = colors.onPrimary;

  return (
    <View
      className="overflow-hidden rounded-card p-6"
      style={[styles.card, { backgroundColor: colors.primaryContainer, shadowColor: colors.shadow }]}>
      {/* Decorative glow circles (the mock's blurred blobs, sans blur). */}
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
            <Path
              d={RING_PATH}
              fill="none"
              stroke={withAlpha(onCard, 0.2)}
              strokeWidth={3}
            />
            <Path
              d={RING_PATH}
              fill="none"
              stroke={onCard}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={`${percent}, 100`}
            />
          </Svg>
          <Text className="absolute" style={[styles.percent, { color: onCard }]}>
            {percent}%
          </Text>
        </View>

        <View>
          <Text className="mb-1" style={[styles.title, { color: onCard }]}>
            Semester Progress
          </Text>
          <View className="flex-row items-center gap-2">
            <AppIcon name="trending-up" size={14} color={withAlpha(onCard, 0.7)} />
            <Text style={[styles.meta, { color: withAlpha(onCard, 0.9) }]}>
              {weeksDone}/{weeksTotal} weeks
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
  percent: {
    fontSize: 24,
    lineHeight: 32,
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
