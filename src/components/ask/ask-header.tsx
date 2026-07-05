import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

/** Ask AI top bar: back chevron on the left, centred title (see the mock). */
export function AskHeader() {
  const colors = useTheme();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.navigate('/home');
  };

  return (
    <View className="h-14 flex-row items-center px-2">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-pill">
        <AppIcon name="chevron-left" size={26} color={colors.onSurface} />
      </TouchableOpacity>
      <Text className="flex-1 text-center" style={[styles.title, { color: colors.onSurface }]}>
        Ask AI
      </Text>
      {/* Spacer mirrors the back button so the title stays optically centred. */}
      <View className="h-11 w-11" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingBold,
  },
});
