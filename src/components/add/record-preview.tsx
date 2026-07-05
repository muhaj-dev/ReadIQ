import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { GlowCircle } from '@/components/ui/glow-circle';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

// A fixed, natural-looking frozen waveform (deterministic — no per-render random
// so the recorded clip doesn't flicker on the result screen).
const BARS = [
  30, 55, 40, 70, 50, 85, 60, 45, 75, 35, 65, 90, 55, 40, 80, 50, 60, 95, 45,
  70, 35, 60, 85, 50, 40, 75, 55, 65, 45, 80,
];

const format = (seconds: number) =>
  [Math.floor(seconds / 60), seconds % 60].map((part) => String(part).padStart(2, '0')).join(':');

type Props = {
  /** Length of the finished recording, in seconds. */
  seconds: number;
};

/** Recorded-clip preview (3:2 card): frozen waveform + duration, with the
 *  "Transcribed" badge — the record-flow analogue of ScanPreview. */
export function RecordPreview({ seconds }: Props) {
  const colors = useTheme();

  return (
    <View
      className="w-full items-center justify-center overflow-hidden rounded-inner px-5 py-10"
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceLowest,
          borderColor: colors.outlineVariant,
          shadowColor: colors.shadow,
        },
      ]}>
      <View className="absolute">
        <GlowCircle color={colors.secondaryContainer} size={260} opacity={0.35} />
      </View>

      <View className="h-24 flex-row items-center justify-center gap-1">
        {BARS.map((height, index) => (
          <View
            key={index}
            style={[styles.bar, { height: `${height}%`, backgroundColor: colors.secondaryContainer }]}
          />
        ))}
      </View>

      <View className="mt-6 flex-row items-center gap-2">
        <AppIcon name="mic" size={18} color={colors.secondary} />
        <Text style={[styles.time, { color: colors.onSurface }]}>{format(seconds)}</Text>
      </View>

      <View
        className="absolute right-4 top-4 flex-row items-center gap-2 rounded-pill px-3 py-1.5"
        style={[styles.badge, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
        <AppIcon name="check-circle" size={18} color={colors.onPrimary} filled />
        <Text style={[styles.badgeLabel, { color: colors.onPrimary }]}>Transcribed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    // 0 4px 20px rgba(46,49,146,.06) from the mock.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  bar: {
    width: 3,
    borderRadius: 4,
  },
  time: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.headingSemibold,
    fontVariant: ['tabular-nums'],
  },
  badge: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
