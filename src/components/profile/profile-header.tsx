import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GlassCard } from '@/components/profile/glass-card';
import { AppIcon } from '@/components/ui/app-icon';
import { images } from '@/constants/images';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  name: string;
  /** Secondary line under the name — the student's study goal. Hidden if empty. */
  subtitle: string;
  role: string;
};

/** Identity block: avatar with edit badge, name, goal, and the course chip. */
export function ProfileHeader({ name, subtitle, role }: Props) {
  const colors = useTheme();

  return (
    <View className="items-center">
      {/* Avatar — the noteIQ mark in a soft double ring, per the mock. */}
      <View className="mb-6">
        <View
          className="h-32 w-32 rounded-pill border-4 p-1"
          style={{ borderColor: withAlpha(colors.onPrimary, 0.2) }}>
          <View
            className="flex-1 items-center justify-center rounded-pill border-2 p-2"
            style={{
              borderColor: colors.onPrimarySoft,
              backgroundColor: withAlpha(colors.onPrimary, 0.06),
            }}>
            <Image
              source={images.mark}
              style={styles.mark}
              contentFit="contain"
              accessibilityLabel="Profile photo"
            />
          </View>
        </View>
        {/* Photo editing lands with useUserStore (Phase 9). */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Edit photo"
          activeOpacity={0.8}
          className="absolute bottom-1 right-1 h-8 w-8 items-center justify-center rounded-pill border-2"
          style={[
            styles.editBadge,
            {
              backgroundColor: colors.onPrimary,
              borderColor: colors.primary,
              shadowColor: colors.shadow,
            },
          ]}>
          <AppIcon name="edit" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View className="mb-1 flex-row items-center gap-2">
        <Text style={[styles.name, { color: colors.onPrimary }]}>{name}</Text>
        <AppIcon name="edit" size={20} color={withAlpha(colors.onPrimarySoft, 0.6)} />
      </View>
      {subtitle ? (
        <Text className="mb-4" style={[styles.email, { color: colors.onPrimarySoft }]}>
          {subtitle}
        </Text>
      ) : (
        <View className="mb-4" />
      )}

      <GlassCard className="rounded-pill px-4 py-1.5">
        <Text style={[styles.role, { color: colors.onPrimary }]}>{role}</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  name: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.headingBold,
  },
  email: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.bodyRegular,
  },
  role: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
    letterSpacing: 0.1,
  },
});
