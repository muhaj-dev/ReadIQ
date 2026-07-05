import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';

// Renders noteIQ's answer with the light structure the model is asked to produce
// (see lib/chat.ts SYSTEM_PROMPT): short paragraphs, "- " bullets, "1." numbered
// steps, "**Label:**" section lines, and inline **bold** key terms. It is a tiny,
// forgiving markdown subset — enough to make a dense answer scannable, without a
// heavy dependency. Partial/streaming markdown degrades gracefully to plain text.

type Block =
  | { kind: 'para'; text: string }
  | { kind: 'label'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'ordered'; items: string[] };

const BULLET_RE = /^\s*[-*•]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const HEADING_RE = /^\s*#{1,6}\s+(.*)$/;
// A whole line that is just "**Label:**" (or "**Label**") — a section header.
const LABEL_RE = /^\*\*(.+?)\*\*:?$/;

/** Group the answer's lines into paragraphs, bullet lists, numbered lists, and
 *  section-label lines. Blank lines and a change of kind flush the current run. */
function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'para', text: para.join(' ') });
    para = [];
  };
  const flushBullets = () => {
    if (bullets.length) blocks.push({ kind: 'bullets', items: bullets });
    bullets = [];
  };
  const flushOrdered = () => {
    if (ordered.length) blocks.push({ kind: 'ordered', items: ordered });
    ordered = [];
  };
  const flushAll = () => {
    flushPara();
    flushBullets();
    flushOrdered();
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushAll();
      continue;
    }

    const bullet = line.match(BULLET_RE);
    const number = line.match(ORDERED_RE);
    const heading = line.match(HEADING_RE);
    const label = line.match(LABEL_RE);

    if (bullet) {
      flushPara();
      flushOrdered();
      bullets.push(bullet[1].trim());
    } else if (number) {
      flushPara();
      flushBullets();
      ordered.push(number[1].trim());
    } else if (heading) {
      flushAll();
      blocks.push({ kind: 'label', text: heading[1].trim() });
    } else if (label) {
      flushAll();
      blocks.push({ kind: 'label', text: label[1].trim() });
    } else {
      flushBullets();
      flushOrdered();
      para.push(line);
    }
  }

  flushAll();
  return blocks;
}

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

type Props = { text: string };

/** The formatted answer body used inside the AI chat bubble. */
export function AnswerBody({ text }: Props) {
  const colors = useTheme();
  const blocks = parseBlocks(text);

  return (
    <View className="gap-2.5">
      {blocks.map((block, i) => {
        if (block.kind === 'label') {
          return (
            <Text key={i} style={[styles.label, { color: colors.onSurface }]}>
              <Inline text={block.text} />
            </Text>
          );
        }

        if (block.kind === 'para') {
          return (
            <Text key={i} style={[styles.text, { color: colors.onSurface }]}>
              <Inline text={block.text} />
            </Text>
          );
        }

        return (
          <View key={i} className="gap-1.5">
            {block.items.map((item, j) => (
              <View key={j} className="flex-row gap-2">
                <Text style={[styles.marker, { color: colors.primary }]}>
                  {block.kind === 'ordered' ? `${j + 1}.` : '•'}
                </Text>
                <Text style={[styles.text, styles.item, { color: colors.onSurface }]}>
                  <Inline text={item} />
                </Text>
              </View>
            ))}
          </View>
        );
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
  bold: {
    fontFamily: fonts.bodySemibold,
  },
});
