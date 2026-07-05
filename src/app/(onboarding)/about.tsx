import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LabeledInput } from '@/components/onboarding/labeled-input';
import { OnboardButton } from '@/components/onboarding/onboard-button';
import { OnboardIcon } from '@/components/onboarding/onboard-icon';
import { ProgressHeader } from '@/components/onboarding/progress-header';
import { Onboard } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useUserStore } from '@/store/use-user-store';

const FIELDS = [
  { key: 'name', label: 'Your name', placeholder: 'e.g. David Johnson', required: true },
  {
    key: 'studying',
    label: 'What are you studying?',
    placeholder: 'e.g. Computer Science',
    required: true,
  },
  { key: 'goal', label: 'Your goal', placeholder: 'e.g. Pass my finals', required: false },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

/** Onboarding 2/3 — name, course, and goal, saved to the user store. */
export default function AboutScreen() {
  const router = useRouter();
  const setProfile = useUserStore((s) => s.setProfile);
  const [form, setForm] = useState<Record<FieldKey, string>>({ name: '', studying: '', goal: '' });

  // Name and course are required — the app greets students by name and personalizes
  // around what they study, so we don't let them through blank.
  const canContinue = form.name.trim().length > 0 && form.studying.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    setProfile({ name: form.name.trim(), studyingFor: form.studying.trim(), goal: form.goal.trim() });
    router.push('/first-note');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: Onboard.surfaceLowest }}>
      <StatusBar style="dark" />
      {/* SafeAreaView / KeyboardAvoidingView are Style Exception Rule components. */}
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="pt-3">
            <ProgressHeader step={2} />
          </View>

          <View className="px-5 pb-4">
            <Text className="mb-2" style={styles.title}>
              Tell us about you
            </Text>
            <Text style={styles.subtitle}>We&apos;ll personalize your experience.</Text>
          </View>

          <View className="flex-1 gap-6 px-5 py-6">
            {FIELDS.map((field) => (
              <LabeledInput
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                value={form[field.key]}
                required={field.required}
                onChangeText={(text) => setForm((prev) => ({ ...prev, [field.key]: text }))}
              />
            ))}

            <View className="mt-auto flex-row items-center justify-center gap-2 py-4">
              <OnboardIcon name="lock" size={16} color={Onboard.onSurfaceVariant} />
              <Text style={styles.privacy}>
                Saved only on your device.{'\n'}We respect your privacy.
              </Text>
            </View>
          </View>

          {/* Footer actions — 16px gap keeps Back and Continue clearly apart. */}
          <View className="flex-row gap-4 px-5 pb-3 pt-4">
            <OnboardButton
              label="Back"
              variant="outline"
              onPress={() => router.back()}
              className="flex-1"
            />
            <OnboardButton
              label="Continue"
              onPress={handleContinue}
              disabled={!canContinue}
              className="flex-[2]"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
    color: Onboard.onSurface,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
    color: Onboard.onSurfaceVariant,
  },
  privacy: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    color: Onboard.onSurfaceVariant,
  },
});
