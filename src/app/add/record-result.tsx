import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddHeader } from '@/components/add/add-header';
import { AmbientBackground } from '@/components/add/ambient-background';
import { ExtractedTextCard } from '@/components/add/extracted-text-card';
import { RecordPreview } from '@/components/add/record-preview';
import { SaveBar, type SaveState } from '@/components/add/save-bar';
import { TagEditor } from '@/components/add/tag-editor';
import { recordMock } from '@/data/record-mock';
import { useTheme } from '@/hooks/use-theme';

/** Add — Record Result: the recorded clip (waveform + time), the transcript,
 *  tags, and Save to Memory — the record-flow analogue of Scan Result. */
export default function RecordResultScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { seconds } = useLocalSearchParams<{ seconds?: string }>();
  const duration = Number(seconds) || 0;

  // Static transcript for now — the BTL transcription call replaces it in Phase 8.
  const [text, setText] = useState(recordMock.transcript);
  const [tags, setTags] = useState(recordMock.tags);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const addTag = (tag: string) => setTags((now) => (now.includes(tag) ? now : [...now, tag]));

  // Mirrors Scan Result's Saving… → Saved! moment; the notes store lands in Phase 2.
  const save = () => {
    setSaveState('saving');
    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => router.replace('/memory'), 900);
    }, 900);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <AmbientBackground />
      {/* SafeAreaView / KeyboardAvoidingView don't take className (Style Exception Rule). */}
      <SafeAreaView edges={['top']} style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <AddHeader title="Record Result" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}>
            <View className="gap-6">
              <RecordPreview seconds={duration} />
              <View>
                <ExtractedTextCard value={text} onChangeText={setText} />
                <TagEditor tags={tags} onAdd={addTag} />
              </View>
            </View>
          </ScrollView>
          {/* "Retake" starts a fresh recording; Save writes to memory. */}
          <SaveBar
            state={saveState}
            onRetake={() => router.replace('/add/record')}
            onSave={save}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 160,
  },
});
