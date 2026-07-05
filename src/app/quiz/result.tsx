import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizHeader } from '@/components/quiz/quiz-header';
import { QuizIntro } from '@/components/quiz/quiz-intro';
import { ResultActions } from '@/components/quiz/result-actions';
import { ResultSummary } from '@/components/quiz/result-summary';
import { ResultTopics } from '@/components/quiz/result-topics';
import { useTheme } from '@/hooks/use-theme';

type Params = { correct?: string; total?: string; subject?: string; topics?: string };

function parseTopics(raw?: string): string[] {
  try {
    const parsed = JSON.parse(raw ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** QUIZ RESULT — score summary, topics to review, retry or go home. */
export default function QuizResultScreen() {
  const colors = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const topics = parseTopics(params.topics);

  const home = () => router.navigate('/home');
  const retry = () =>
    router.replace({ pathname: '/quiz/active', params: { subject: params.subject ?? 'mixed' } });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <QuizHeader title="Results" onClose={home} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <QuizIntro title="Quiz complete!" subtitle="Here’s how you did on your notes." />
          <ResultSummary correct={correct} total={total} />
          <ResultTopics topics={topics} />
        </ScrollView>

        <View className="px-5 pb-2 pt-3">
          <ResultActions onRetry={retry} onHome={home} />
        </View>
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
    paddingTop: 16,
    paddingBottom: 24,
    gap: 28,
  },
});
