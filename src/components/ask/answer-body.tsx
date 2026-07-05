import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { parseAnswer, type Leaf } from '@/lib/answer-blocks';
import { withAlpha } from '@/lib/color';

// Renders noteIQ's answer from the parsed block structure (see lib/answer-blocks):
// short paragraphs, "- " bullets, "1." numbered steps, "**Label:**" section cards,
// and inline **bold** key terms. A section is drawn as a bordered inner card
// (accent title + body) so a multi-part answer reads like the mock — intro
// paragraph, one card per section, optional closing paragraph.

/** Render a line's inline **bold** spans, leaving the rest as plain text. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.length >= 4 && part.startsWith('**') && part.endsWith('**');
        return (
          <Text key={i} style={bold ? styles.bold : undefined}>
            {bold ? part.slice(2, -2) : part}
          </Text>
        );
      })}
    </>
  );
}

/** Render one leaf (paragraph, bullet list, or numbered list). Shared by the
 *  top-level body and each section card so they format identically. */
function LeafBlock({ block, textColor }: { block: Leaf; textColor: string }) {
  const colors = useTheme();

  if (block.kind === 'para') {
    return (
      <Text style={[styles.text, { color: textColor }]}>
        <Inline text={block.text} />
      </Text>
    );
  }

  return (
    <View className="gap-1.5">
      {block.items.map((item, j) => (
        <View key={j} className="flex-row gap-2">
          <Text style={[styles.marker, { color: colors.primary }]}>
            {block.kind === 'ordered' ? `${j + 1}.` : '•'}
          </Text>
          <Text style={[styles.text, styles.item, { color: textColor }]}>
            <Inline text={item} />
          </Text>
        </View>
      ))}
    </View>
  );
}

type Props = { text: string };

/** The formatted answer body used inside the AI chat bubble. */
export function AnswerBody({ text }: Props) {
  const colors = useTheme();
  const blocks = parseAnswer(text);

  return (
    <View className="gap-2.5">
      {blocks.map((block, i) => {
        if (block.kind === 'section') {
          return (
            <View
              key={i}
              className="gap-1.5 rounded-inner p-3"
              style={{
                backgroundColor: colors.surfaceLow,
                borderWidth: 1,
                borderColor: withAlpha(colors.outlineVariant, 0.6),
              }}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                <Inline text={block.title} />
              </Text>
              {block.body.map((leaf, j) => (
                <LeafBlock key={j} block={leaf} textColor={colors.onSurfaceVariant} />
              ))}
            </View>
          );
        }

        // A bare label with no body of its own — render it as a plain bold heading.
        if (block.kind === 'label') {
          return (
            <Text key={i} style={[styles.label, { color: colors.onSurface }]}>
              <Inline text={block.text} />
            </Text>
          );
        }

        return <LeafBlock key={i} block={block} textColor={colors.onSurface} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.bodyRegular,
  },
  item: {
    flex: 1,
  },
  marker: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.bodySemibold,
    minWidth: 16,
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.bodyBold,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  bold: {
    fontFamily: fonts.bodySemibold,
  },
});
