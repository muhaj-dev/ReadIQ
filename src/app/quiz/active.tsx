import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NextButton } from '@/components/quiz/next-button';
import { QuizFeedback } from '@/components/quiz/quiz-feedback';
import { QuizHeader } from '@/components/quiz/quiz-header';
import { QuizOption, type OptionStatus } from '@/components/quiz/quiz-option';
import { QuizProgress } from '@/components/quiz/quiz-progress';
import { QuizQuestion } from '@/components/quiz/quiz-question';
import { quizQuestions } from '@/data/quiz-questions';
import { useTheme } from '@/hooks/use-theme';

/** QUIZ — one question per screen with immediate green/red feedback. */
export default function QuizActiveScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { subject } = useLocalSearchParams<{ subject?: string }>();

  // 'mixed' (or a direct visit) quizzes everything; otherwise filter by subject.
  const questions = useMemo(() => {
    if (!subject || subject === 'mixed') return quizQuestions;
    const picked = quizQuestions.filter((q) => q.subject === subject);
    return picked.length > 0 ? picked : quizQuestions;
  }, [subject]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  const question = questions[index];
  const total = questions.length;
  const answered = selected !== null;
  const isCorrect = selected === question.answerKey;
  const isLast = index === total - 1;

  const statusFor = (key: string): OptionStatus => {
    if (!answered) return 'idle';
    if (key === question.answerKey) return 'correct';
    if (key === selected) return 'wrong';
    return 'idle';
  };

  const onSelect = (key: string) => {
    if (answered) return;
    setSelected(key);
    if (key === question.answerKey) setCorrect((c) => c + 1);
    else setWeakTopics((t) => (t.includes(question.sourceNoteTitle) ? t : [...t, question.sourceNoteTitle]));
  };

  const exit = () => (router.canGoBack() ? router.back() : router.navigate('/home'));

  const onNext = () => {
    if (isLast) {
      return router.replace({
        pathname: '/quiz/result',
        params: {
          correct: String(correct),
          total: String(total),
          subject: subject ?? 'mixed',
          topics: JSON.stringify(weakTopics),
        },
      });
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <QuizHeader onClose={exit} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <QuizProgress current={index + 1} total={total} />
          <QuizQuestion prompt={question.prompt} />

          <View className="gap-3">
            {question.options.map((option) => (
              <QuizOption
                key={option.key}
                letter={option.key}
                text={option.text}
                status={statusFor(option.key)}
                disabled={answered}
                onPress={() => onSelect(option.key)}
              />
            ))}
          </View>

          {answered && <QuizFeedback correct={isCorrect} />}
        </ScrollView>

        <View className="px-5 pb-2 pt-3">
          <NextButton
            label={isLast ? 'Finish' : 'Next Question'}
            enabled={answered}
            onPress={onNext}
          />
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
    gap: 24,
  },
});
