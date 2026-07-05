import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  text: string;
  time: string;
};

/** Right-aligned indigo bubble for the student's question. */
export function UserBubble({ text, time }: Props) {
  const colors = useTheme();

  return (
    <View className="items-end">
      <View
        className="max-w-[85%] rounded-card p-4"
        style={[
          styles.bubble,
          { backgroundColor: colors.secondaryContainer, shadowColor: colors.shadow },
        ]}>
        <Text style={[styles.text, { color: colors.onPrimary }]}>{text}</Text>
        <Text
          className="mt-2 text-right"
          style={[styles.time, { color: withAlpha(colors.onPrimary, 0.8) }]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderTopRightRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.bodyRegular,
  },
  time: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.bodyRegular,
  },
});
