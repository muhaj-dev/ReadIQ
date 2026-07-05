import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddHeader } from '@/components/add/add-header';
import { AmbientBackground } from '@/components/add/ambient-background';
import { ExtractedTextCard } from '@/components/add/extracted-text-card';
import { SaveBar, type SaveState } from '@/components/add/save-bar';
import { ScanPreview } from '@/components/add/scan-preview';
import { TagEditor } from '@/components/add/tag-editor';
import { scanMock } from '@/data/scan-mock';
import { useTheme } from '@/hooks/use-theme';

/** Add — Scan Result: confirm the extracted text, tag it, save to memory. */
export default function ScanResultScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();

  // Static OCR output for now — the BTL vision call replaces it in Phase 8.
  const [text, setText] = useState(scanMock.extractedText);
  const [tags, setTags] = useState(scanMock.tags);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const addTag = (tag: string) => setTags((now) => (now.includes(tag) ? now : [...now, tag]));

  // Mirrors the mock's Saving… → Saved! moment; the notes store lands in Phase 2.
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
          <AddHeader title="Scan Result" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}>
            <View className="gap-6">
              <ScanPreview uri={uri} />
              <View>
                <ExtractedTextCard value={text} onChangeText={setText} />
                <TagEditor tags={tags} onAdd={addTag} />
              </View>
            </View>
          </ScrollView>
          <SaveBar state={saveState} onRetake={() => router.back()} onSave={save} />
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
