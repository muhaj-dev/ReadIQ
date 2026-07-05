import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

/** "Extracted Text" section: heading + Edit toggle + the OCR text card. */
export function ExtractedTextCard({ value, onChangeText }: Props) {
  const colors = useTheme();
  const [editing, setEditing] = useState(false);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text style={[styles.heading, { color: colors.primary }]}>Extracted Text</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Finish editing' : 'Edit extracted text'}
          onPress={() => setEditing((now) => !now)}
          className="h-11 flex-row items-center gap-1 px-1">
          <Text style={[styles.editLabel, { color: colors.secondary }]}>
            {editing ? 'Done' : 'Edit'}
          </Text>
          <AppIcon name={editing ? 'check-circle' : 'edit'} size={16} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View
        className="rounded-inner p-5"
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceLowest,
            borderColor: editing ? colors.secondaryContainer : colors.outlineVariant,
            shadowColor: colors.shadow,
          },
        ]}>
        {editing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            multiline
            autoFocus
            style={[styles.body, styles.input, { color: colors.onSurface }]}
          />
        ) : (
          <Text style={[styles.body, { color: colors.onSurface }]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.headingSemibold,
  },
  editLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  card: {
    borderWidth: 1,
    // 0 4px 20px rgba(46,49,146,.06) from the mock.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: fonts.bodyRegular,
  },
  input: {
    padding: 0,
    textAlignVertical: 'top',
  },
});
