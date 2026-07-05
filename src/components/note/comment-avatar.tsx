import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { useTheme } from '@/hooks/use-theme';

/** The commenter's avatar in the reader's Figma-style comment card. This is the
 *  student's own margin note, so the identity is "You" — a filled indigo circle
 *  with a person glyph (honest, no faked initials for a name we don't store). */
export function CommentAvatar({ size = 34 }: { size?: number }) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary },
      ]}>
      <AppIcon name="person" size={Math.round(size * 0.62)} color={colors.onPrimary} filled />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
