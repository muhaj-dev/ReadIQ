import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import type { AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  /** How many notes are ticked — drives the label and the disabled state. */
  count: number;
  onShare: () => void;
  onDelete: () => void;
};

/** The bottom bar shown while selecting notes in the Memory Panel: a live count
 *  plus Share and Delete. Both actions are disabled until at least one note is
 *  ticked, so the student can't fire an empty action. */
export function MemorySelectBar({ count, onShare, onDelete }: Props) {
  const colors = useTheme();
  const disabled = count === 0;

  return (
    <View
      className="flex-row items-center pb-4 pt-3"
      style={{ backgroundColor: colors.surface, borderTopColor: withAlpha(colors.outlineVariant, 0.2), borderTopWidth: 1 }}>
      {/* Count + Share sit on the left. */}
      <View className="flex-1 flex-row items-center gap-4 pl-5">
        <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>
          {count === 0 ? 'Select notes' : `${count} selected`}
        </Text>

        <Action
          icon="ios-share"
          label="Share"
          color={colors.primary}
          tint={withAlpha(colors.primary, 0.1)}
          disabled={disabled}
          onPress={onShare}
        />
      </View>

      {/* Delete floats directly above the Memory tab. The tab bar lays out 5 slots
          with justify-around, so Memory's centre is at 70% of the width; -28 (half
          the 56px button) re-centres the button on that point. */}
      <View style={styles.deleteSlot}>
        <Action
          icon="delete"
          label="Delete"
          color={colors.error}
          tint={withAlpha(colors.error, 0.1)}
          disabled={disabled}
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

/** One circular icon-only action button in the select bar. */
function Action({
  icon,
  label,
  color,
  tint,
  disabled,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  color: string;
  tint: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      className="h-14 w-14 items-center justify-center rounded-full"
      style={{ backgroundColor: tint, opacity: disabled ? 0.4 : 1 }}>
      <AppIcon name={icon} size={26} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  count: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  deleteSlot: {
    position: 'absolute',
    left: '70%',
    top: 0,
    bottom: 0,
    marginLeft: -28,
    justifyContent: 'center',
  },
});
