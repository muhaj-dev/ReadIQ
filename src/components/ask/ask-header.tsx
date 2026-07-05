import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { useChatStore } from '@/store/use-chat-store';

/** Ask AI top bar: back chevron, centred title, and the new-chat + history
 *  actions that manage the saved conversation list (see the mock). */
export function AskHeader() {
  const colors = useTheme();
  const router = useRouter();
  const newChat = useChatStore((s) => s.newChat);
  const hasMessages = useChatStore((s) => s.messages.length > 0);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/home');
  };

  return (
    <View className="h-14 flex-row items-center px-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-pill">
        <AppIcon name="chevron-left" size={26} color={colors.onSurface} />
      </TouchableOpacity>
      <Text className="flex-1 text-center" style={[styles.title, { color: colors.onSurface }]}>
        Ask AI
      </Text>
      {/* New chat clears the thread (the old one stays saved in history). It is
          disabled on an already-empty chat so it never no-ops confusingly. */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="New chat"
        disabled={!hasMessages}
        onPress={newChat}
        className="h-11 w-11 items-center justify-center rounded-pill"
        style={!hasMessages ? styles.disabled : undefined}>
        <AppIcon name="edit-note" size={24} color={colors.onSurface} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Chat history"
        onPress={() => router.push('/ask-history')}
        className="h-11 w-11 items-center justify-center rounded-pill">
        <AppIcon name="schedule" size={23} color={colors.onSurface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingBold,
  },
  disabled: {
    opacity: 0.35,
  },
});
