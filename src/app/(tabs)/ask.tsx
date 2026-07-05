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
      {/* SafeAreaView/KeyboardAvoidingView take no className (Style Exception). This screen owns the bottom inset. */}
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        {/* KeyboardAvoidingView must sit OUTSIDE SwipeBackView's Reanimated transform, or the keyboard covers the input. iOS pads, Android resizes. */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Ask is a tab, so no native back gesture — SwipeBackView adds the edge swipe. */}
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
