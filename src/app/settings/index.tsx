import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/components/settings/settings-header';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';
import { settingsSections } from '@/data/settings';
import { useTheme } from '@/hooks/use-theme';

/** SETTINGS — grouped preference rows per the settings mock. Values become
 *  live once useSettingsStore lands (Phase 9); only Data & Privacy navigates. */
export default function SettingsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const [focusMode, setFocusMode] = useState(true);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <SettingsHeader title="Settings" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {settingsSections.map((section) => (
            <SettingsSection key={section.key} label={section.label}>
              {section.rows.map((row, index) => (
                <SettingsRow
                  key={row.key}
                  item={row}
                  divider={index < section.rows.length - 1}
                  toggled={row.key === 'focus' ? focusMode : undefined}
                  onToggle={row.key === 'focus' ? setFocusMode : undefined}
                  onPress={
                    row.key === 'data-privacy'
                      ? () => router.push('/settings/data-privacy')
                      : undefined
                  }
                />
              ))}
            </SettingsSection>
          ))}
        </ScrollView>
      </SafeAreaView>
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
    gap: 40,
  },
});
