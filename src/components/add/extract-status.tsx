import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  state: 'reading' | 'summarizing' | 'error';
  fileName: string;
  /** Friendly error line (shown when state === 'error'). */
  message?: string;
  onRetry: () => void;
  onSkip: () => void;
};

// Spinner copy per busy state — reading pulls the text out, summarizing writes a
// short AI summary. Both talk to the BTL runtime, so the hint says so.
const BUSY_COPY = {
  reading: {
    title: 'Reading your document…',
    hint: 'Pulling the text out through your study assistant.',
  },
  summarizing: {
    title: 'Summarizing…',
    hint: 'Writing a quick summary with your study assistant.',
  },
} as const;

/** Full-screen status while an uploaded PDF is read, then summarized through the
 *  BTL runtime — a calm spinner, or a graceful error with a way forward (never a
 *  raw failure). */
export function ExtractStatus({ state, fileName, message, onRetry, onSkip }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.surface }}>
      {state !== 'error' ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-6 text-center" style={[styles.title, { color: colors.onSurface }]}>
            {BUSY_COPY[state].title}
          </Text>
          <Text numberOfLines={1} className="mt-1.5 text-center" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {fileName}
          </Text>
          <Text className="mt-1 text-center" style={[styles.hint, { color: colors.outline }]}>
            {BUSY_COPY[state].hint}
          </Text>
        </>
      ) : (
        <>
          <View
            className="h-16 w-16 items-center justify-center rounded-pill"
            style={{ backgroundColor: withAlpha(colors.errorContainer, 0.6) }}>
            <AppIcon name="warning" size={30} color={colors.error} />
          </View>
          <Text className="mt-5 text-center" style={[styles.title, { color: colors.onSurface }]}>
            Couldn&apos;t read that document
          </Text>
          <Text className="mt-2 text-center" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {message ?? 'Something went wrong reading the file.'}
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={onRetry}
            className="mt-7 w-full items-center rounded-lg py-3.5"
            style={{ backgroundColor: colors.primaryContainer }}>
            <Text style={[styles.btnPrimary, { color: colors.onPrimary }]}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onSkip}
            className="mt-3 w-full items-center py-3">
            <Text style={[styles.btnGhost, { color: colors.primary }]}>Add without text</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.headingBold,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.bodyRegular,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
  btnPrimary: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodySemibold,
  },
  btnGhost: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
