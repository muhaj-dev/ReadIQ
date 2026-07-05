import { Image, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  heading: string;
  excerpt: string;
  /** Note image (e.g. a scanned page). Pasted text and PDFs have none — the
   *  card then shows just heading + excerpt, never a placeholder image well. */
  image?: string | null;
};

/** The Content Preview card on Note Details: heading, excerpt, and — only when
 *  the note actually carries one — its page image. */
export function ContentPreview({ heading, excerpt, image }: Props) {
  const colors = useTheme();

  return (
    <View>
      <Text className="mb-3" style={[styles.sectionHeading, { color: colors.onSurface }]}>
        Content Preview
      </Text>
      <View
        className="gap-4 rounded-card border p-5"
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceLowest,
            borderColor: colors.outlineVariant,
            shadowColor: colors.shadow,
          },
        ]}>
        <Text style={[styles.heading, { color: colors.onSurface }]}>{heading}</Text>
        <Text numberOfLines={2} style={[styles.excerpt, { color: colors.onSurfaceVariant }]}>
          {excerpt}
        </Text>
        {image ? (
          <Image
            source={{ uri: image }}
            className="aspect-[4/3] w-full rounded-lg"
            resizeMode="cover"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeading: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fonts.headingSemibold,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.bodyRegular,
  },
});
