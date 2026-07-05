import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileBackground } from '@/components/profile/profile-background';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileMenu } from '@/components/profile/profile-menu';
import { ProfileStats } from '@/components/profile/profile-stats';
import { profile } from '@/data/profile';
import { useProfile } from '@/hooks/use-profile';

/** PROFILE tab — identity, study stats, and the account menu (see the profile mock). */
export default function ProfileScreen() {
  // The indigo panel needs light status-bar icons, but only while this tab is
  // focused — sibling tabs stay mounted with their own dark StatusBar.
  const focused = useIsFocused();
  // Identity + study stats come from the real stores; the menu stays static
  // (its rows land in later phases).
  const { user, stats } = useProfile();

  return (
    <View className="flex-1">
      <ProfileBackground />
      {focused && <StatusBar style="light" />}
      {/* SafeAreaView doesn't support className (Style Exception Rule) → StyleSheet. */}
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* mb-2 stretches the 32px section gap to the mock's 40px under the header. */}
          <View className="mb-2">
            <ProfileHeader {...user} />
          </View>
          <ProfileStats stats={stats} />
          <ProfileMenu items={profile.menu} />
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
    paddingTop: 32,
    paddingBottom: 24,
    gap: 32,
  },
});
