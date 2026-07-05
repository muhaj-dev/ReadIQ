import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizHeader } from '@/components/quiz/quiz-header';
import { QuizIntro } from '@/components/quiz/quiz-intro';
import { SubjectCard } from '@/components/quiz/subject-card';
import { quizSubjects } from '@/data/quiz-subjects';
import { useTheme } from '@/hooks/use-theme';

/** QUIZ HOME — pick a subject before starting a quiz (reached from Dashboard). */
export default function QuizHomeScreen() {
  const colors = useTheme();
  const router = useRouter();

  const start = (subject: string) =>
    router.push({ pathname: '/quiz/active', params: { subject } });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.safe}>
        <QuizHeader />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <QuizIntro
            title="Pick a subject to quiz"
            subtitle="Questions come straight from your saved notes."
          />

          <View className="gap-3">
            {quizSubjects.map((subject) => (
              <SubjectCard key={subject.key} subject={subject} onPress={() => start(subject.key)} />
            ))}
          </View>
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
    paddingTop: 16,
    paddingBottom: 32,
    gap: 32,
  },
});
