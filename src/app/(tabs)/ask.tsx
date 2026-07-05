import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AskConversation } from '@/components/ask/ask-conversation';
import { AskHeader } from '@/components/ask/ask-header';
import { AskInputBar } from '@/components/ask/ask-input-bar';
import { SwipeBackView } from '@/components/navigation/swipe-back';
import { useTheme } from '@/hooks/use-theme';
import { useChatStore } from '@/store/use-chat-store';

/** ASK ★ — the grounded chat. Answers come only from the student's saved notes,
 *  stream in live, and prove themselves with "From your notes" source tags. */
export default function AskScreen() {
  const colors = useTheme();
  const [draft, setDraft] = useState('');
  const messages = useChatStore((s) => s.messages);
  const send = useChatStore((s) => s.send);

  const onSend = () => {
    const question = draft.trim();
    if (!question) return;
    setDraft('');
    send(question);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      {/* SafeAreaView / KeyboardAvoidingView don't take className (Style Exception Rule).
          The tab bar is hidden here, so this screen owns the bottom inset that keeps
          the input pill clear of the home indicator / gesture bar. */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        {/* KeyboardAvoidingView must sit OUTSIDE the Reanimated transform in
            SwipeBackView — measuring its frame inside the transformed subtree
            under-lifts the pinned input, so the keyboard covered it. iOS pads,
            Android (edge-to-edge, SDK 54) resizes by height. */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Ask is a tab (not a pushed route), so it gets no native back gesture.
              SwipeBackView adds the edge swipe left→right, matching /add. */}
          <SwipeBackView>
            <AskHeader />
            <AskConversation messages={messages} onPickChip={setDraft} />
            <AskInputBar value={draft} onChangeText={setDraft} onSend={onSend} />
          </SwipeBackView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
