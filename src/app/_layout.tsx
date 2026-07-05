import '@/global.css';

import {
  HankenGrotesk_400Regular,
  HankenGrotesk_400Regular_Italic,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { useChatStore } from '@/store/use-chat-store';
import { useNotesStore } from '@/store/use-notes-store';
import { useOnboardingStore } from '@/store/use-onboarding-store';
import { useSubjectsStore } from '@/store/use-subjects-store';
import { useUserStore } from '@/store/use-user-store';

// Keep the native splash (app icon) up until the JS splash screen has mounted.
SplashScreen.preventAutoHideAsync();

/** The hackathon build is light-only — the theme toggle arrives in Phase 9. */
export default function RootLayout() {
  // Design fonts (Manrope headings · Hanken Grotesk body — see the mocks).
  // The native splash stays up until they're ready, so text never flashes
  // in the system font.
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_400Regular_Italic,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  // Load saved notes + subjects from SQLite once, as early as possible.
  // Read the onboarding flag too, so the splash knows where to route.
  // Load the profile, then count today's visit toward the study streak.
  const initNotes = useNotesStore((s) => s.init);
  const initSubjects = useSubjectsStore((s) => s.init);
  const initOnboarding = useOnboardingStore((s) => s.init);
  const initUser = useUserStore((s) => s.init);
  const initChat = useChatStore((s) => s.init);
  const recordDailyActivity = useUserStore((s) => s.recordDailyActivity);
  useEffect(() => {
    initNotes();
    initSubjects();
    initOnboarding();
    initChat();
    // Streak must be counted after the profile has loaded, or a first tick would
    // overwrite the persisted lastActiveDate before we've read it.
    initUser().then(recordDailyActivity);
  }, [initNotes, initSubjects, initOnboarding, initChat, initUser, recordDailyActivity]);

  if (!fontsLoaded) return null;

  return (
    // Root host for react-native-gesture-handler (the Ask screen's swipe-back).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.light.background },
            animation: 'fade',
          }}
        />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
