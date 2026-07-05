import type { ReactNode } from 'react';
import { Keyboard, type StyleProp, TouchableWithoutFeedback, View, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Wraps a screen body so tapping any empty space dismisses the keyboard.
 * Essential for multiline note fields, where "return" inserts a newline instead
 * of closing the keyboard — without this there is no way to bring it down on
 * iOS. Child inputs and buttons keep their own taps; only unhandled taps on
 * blank space trigger the dismiss. Works on iOS and Android.
 */
export function DismissKeyboardView({ children, style }: Props) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={style}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
