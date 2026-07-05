import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AiBubble } from '@/components/ask/ai-bubble';
import { AskHero } from '@/components/ask/ask-hero';
import { FromYourNotesCard } from '@/components/ask/from-your-notes-card';
import { SuggestionChips } from '@/components/ask/suggestion-chips';
import { UserBubble } from '@/components/ask/user-bubble';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { suggestionChips } from '@/data/ask-chat';
import { useTheme } from '@/hooks/use-theme';
import { clockTime } from '@/lib/relative-time';
import type { ChatMessage } from '@/types/chat';

/** Nudge shown under an ungrounded answer — the honest "add a note" path. */
function AddNoteCta() {
  const colors = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Add a note"
      activeOpacity={0.8}
      onPress={() => router.push('/add')}
      className="max-w-[70%] flex-row items-center gap-2 self-start rounded-inner px-3 py-2"
      style={{ backgroundColor: colors.surfaceContainer }}>
      <AppIcon name="add" size={18} color={colors.primary} />
      <Text style={[styles.ctaLabel, { color: colors.primary }]}>Add a note</Text>
    </TouchableOpacity>
  );
}

/** One turn: the student's question, or noteIQ's answer + its source tags. */
function MessageRow({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return <UserBubble text={message.content} time={clockTime(message.createdAt)} />;
  }

  const settled = !message.streaming;
  const ungrounded = settled && !message.error && !message.grounded;

  return (
    <View className="gap-3">
      <AiBubble
        text={message.content}
        time={clockTime(message.createdAt)}
        streaming={message.streaming}
        error={message.error}
      />
      {message.citations.map((citation) => (
        <FromYourNotesCard
          key={citation.noteId}
          noteId={citation.noteId}
          noteTitle={citation.noteTitle}
        />
      ))}
      {ungrounded ? <AddNoteCta /> : null}
    </View>
  );
}

type Props = {
  messages: ChatMessage[];
  /** Tapping a suggestion chip seeds the input box. */
  onPickChip: (chip: string) => void;
};

/** Scrollable chat area: the calm hero + chips when empty, the thread otherwise. */
export function AskConversation({ messages, onPickChip }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const empty = messages.length === 0;

  // Follow the conversation as it grows and as tokens stream in (`messages` gets
  // a new identity on every token, so this fires throughout the answer).
  useEffect(() => {
    if (empty) return;
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, empty]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.content}>
      {empty ? (
        <>
          <AskHero />
          <View className="mt-8">
            <SuggestionChips chips={suggestionChips} onPick={onPickChip} />
          </View>
        </>
      ) : (
        <View className="gap-6">
          {messages.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  ctaLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bodySemibold,
  },
});
