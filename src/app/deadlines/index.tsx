import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddFab } from '@/components/deadlines/add-fab';
import { CalendarGrid } from '@/components/deadlines/calendar-grid';
import { DeadlinesHeader } from '@/components/deadlines/deadlines-header';
import { MonthSwitcher } from '@/components/deadlines/month-switcher';
import { UpcomingList } from '@/components/deadlines/upcoming-list';
import { deadlinesMonth, upcomingDeadlines } from '@/data/deadlines';
import { useTheme } from '@/hooks/use-theme';

/** DEADLINES — month calendar + upcoming list. Content is static until the store lands. */
export default function DeadlinesScreen() {
  const colors = useTheme();
  const router = useRouter();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <DeadlinesHeader />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View className="gap-4">
            <MonthSwitcher label={deadlinesMonth.label} />
            <CalendarGrid
              year={deadlinesMonth.year}
              monthIndex={deadlinesMonth.monthIndex}
              selectedDay={deadlinesMonth.selectedDay}
            />
          </View>

          <UpcomingList deadlines={upcomingDeadlines} />
        </ScrollView>

        <AddFab onPress={() => router.push('/deadlines/add')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 96, // keeps the last card clear of the floating + button
    gap: 40,
  },
});
