import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';

type Props = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
};

/**
 * "Tell us about you" form field: label + soft-filled input that lifts to a
 * white background with an indigo border while focused (per the mockup).
 */
export function LabeledInput({ label, value, placeholder, onChangeText }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <Text style={styles.label}>{label}</Text>
      {/* TextInput is a Style Exception Rule component → styles, not className. */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Onboard.outlineVariant}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    color: Onboard.onSurface,
  },
  input: {
    backgroundColor: Onboard.surfaceLow,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bodyRegular,
    color: Onboard.onSurface,
  },
  inputFocused: {
    backgroundColor: Onboard.surfaceLowest,
    borderColor: Onboard.secondaryContainer,
  },
});
