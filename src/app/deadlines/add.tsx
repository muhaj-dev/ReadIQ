import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorRow } from '@/components/deadlines/color-row';
import { DateTimeRow } from '@/components/deadlines/date-time-row';
import { FormField } from '@/components/form/form-field';
import { FormHeader } from '@/components/form/form-header';
import { FormInput } from '@/components/form/form-input';
import { OptionSheet } from '@/components/form/option-sheet';
import { SelectRow } from '@/components/form/select-row';
import { initialDraft, pickerOptions } from '@/data/deadlines';
import { useTheme } from '@/hooks/use-theme';

type SheetKey = keyof typeof pickerOptions;

/** ADD DEADLINE — form per the mock. Saving persists once useDeadlinesStore lands. */
export default function AddDeadlineScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [sheet, setSheet] = useState<SheetKey | null>(null);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const close = () => (router.canGoBack() ? router.back() : router.navigate('/deadlines'));

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <FormHeader title="Add Deadline" onBack={close} onSave={close} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}>
          <FormField label="Title">
            <FormInput value={draft.title} onChangeText={(v) => set('title', v)} placeholder="e.g. Biochemistry Exam" />
          </FormField>

          <FormField label="Subject">
            <SelectRow value={draft.subject} dotColor={colors.secondaryContainer} onPress={() => setSheet('subject')} />
          </FormField>

          <FormField label="Type">
            <SelectRow value={draft.type} onPress={() => setSheet('type')} />
          </FormField>

          <FormField label="Due Date">
            <DateTimeRow date={draft.date} time={draft.time} />
          </FormField>

          <FormField label="Reminder">
            <SelectRow value={draft.reminder} onPress={() => setSheet('reminder')} />
          </FormField>

          <FormField label="Repeat">
            <SelectRow value={draft.repeat} onPress={() => setSheet('repeat')} />
          </FormField>

          <FormField label="Notes">
            <FormInput multiline value={draft.notes} onChangeText={(v) => set('notes', v)} placeholder="Anything to remember?" />
          </FormField>

          <View className="pt-2">
            <FormField label="Color">
              <ColorRow selectedIndex={draft.colorIndex} onSelect={(i) => set('colorIndex', i)} />
            </FormField>
          </View>
        </ScrollView>
      </SafeAreaView>

      <OptionSheet
        visible={sheet !== null}
        options={sheet ? pickerOptions[sheet] : []}
        selected={sheet ? draft[sheet] : ''}
        onSelect={(label) => {
          if (sheet) set(sheet, label);
          setSheet(null);
        }}
        onCancel={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
});
