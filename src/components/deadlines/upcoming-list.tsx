import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ColorTokens } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import type { DeadlineUrgency, UpcomingDeadline } from '@/data/deadlines';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  deadlines: UpcomingDeadline[];
};

// Mock: "Due today" red, "1 day left" orange, "3 days left" indigo.
function statusColor(urgency: DeadlineUrgency, colors: ColorTokens) {
  if (urgency === 'today') return colors.error;
  if (urgency === 'soon') return colors.dueSoon;
  return colors.primary;
}

/** "Upcoming" section: one white card per deadline with a coloured status label. */
export function UpcomingList({ deadlines }: Props) {
  const colors = useTheme();

  return (
    <View className="gap-3">
      <Text style={[styles.heading, { color: colors.onSurface }]}>Upcoming</Text>

      {deadlines.map((deadline) => (
        <TouchableOpacity
          key={deadline.id}
          activeOpacity={0.7}
          className="flex-row items-center justify-between rounded-inner p-5"
          style={[styles.card, { backgroundColor: colors.surfaceLowest, shadowColor: colors.shadow }]}>
          <View className="gap-1">
            <Text style={[styles.title, { color: colors.onSurface }]}>{deadline.title}</Text>
            <Text style={[styles.when, { color: colors.onSurfaceVariant }]}>{deadline.when}</Text>
          </View>
          <Text style={[styles.status, { color: statusColor(deadline.urgency, colors) }]}>
            {deadline.status}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: fonts.headingBold,
  },
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  when: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
