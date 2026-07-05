import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyHint } from '@/components/home/empty-hint';
import { SectionHeader } from '@/components/home/section-header';
import { StatCards } from '@/components/home/stat-cards';
import { WeakTopicChips } from '@/components/home/weak-topic-chips';
import { PerfHero } from '@/components/profile/perf-hero';
import { QuizAttemptRow } from '@/components/profile/quiz-attempt-row';
import { SettingsHeader } from '@/components/settings/settings-header';
import type { DashboardStat } from '@/data/dashboard';
import { useTheme } from '@/hooks/use-theme';
import { quizPerformance } from '@/lib/profile-stats';
import { summarizeWeakTopics } from '@/lib/quiz-stats';
import { useQuizStore } from '@/store/use-quiz-store';

/** How many recent attempts the list shows. */
const RECENT_LIMIT = 8;

/** QUIZ PERFORMANCE — average score, stats, recent attempts + weak topics. */
export default function QuizPerformanceScreen() {
  const colors = useTheme();
  const router = useRouter();
  const results = useQuizStore((s) => s.results);
  const perf = quizPerformance(results);
  const weakTopics = summarizeWeakTopics(results);

  const stats: DashboardStat[] = [
    { value: String(perf.quizzesTaken), label: 'Quizzes', tone: 'primary' },
    { value: `${perf.bestPercent}%`, label: 'Best Score', tone: 'secondary' },
    { value: String(perf.questionsAnswered), label: 'Answered', tone: 'deep' },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <SettingsHeader title="Quiz Performance" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {perf.averagePercent === null ? (
            <EmptyHint
              icon="quiz"
              title="No quizzes yet"
              subtitle="Take a quiz from your notes and your scores will appear here."
              cta="Start a quiz"
              onPress={() => router.push('/quiz')}
            />
          ) : (
            <>
              <PerfHero
                averagePercent={perf.averagePercent}
                bestPercent={perf.bestPercent}
                encouragement={perf.encouragement}
              />
              <StatCards stats={stats} />

              <View className="gap-3">
                <SectionHeader title="Recent Quizzes" />
                <View className="gap-3">
                  {results.slice(0, RECENT_LIMIT).map((r) => (
                    <QuizAttemptRow key={r.id} result={r} />
                  ))}
                </View>
              </View>

              {weakTopics.length > 0 ? (
                <View className="gap-3">
                  <SectionHeader title="Weak Topics" />
                  <WeakTopicChips topics={weakTopics} />
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 40,
    gap: 24,
  },
});
