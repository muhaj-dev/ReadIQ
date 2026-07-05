import type { EditorBridge } from '@10play/tentap-editor';
import { useBridgeState } from '@10play/tentap-editor';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { EditorHighlight } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

type Props = {
  editor: EditorBridge;
  /** Opens the image picker and inserts the chosen image inline. */
  onInsertImage: () => void;
};

/** One toolbar entry: an icon action, an "H1/H2/H3" text action, or a divider. */
type Tool =
  | { kind: 'icon'; icon: AppIconName; label: string; active?: boolean; disabled?: boolean; onPress: () => void }
  | { kind: 'text'; text: string; label: string; active: boolean; onPress: () => void }
  | { kind: 'divider' };

type Colors = ReturnType<typeof useTheme>;

/** Formatting bar above the rich editor. Horizontally scrollable so it holds the
 *  full set — undo/redo · bold/italic/underline/strike/highlight · H1–H3 ·
 *  bullet/numbered/checklist · quote/code — plus insert-image, without crowding
 *  the phone. Buttons light up (accent) when their mark is active at the cursor. */
export function RichToolbar({ editor, onInsertImage }: Props) {
  const colors = useTheme();
  const state = useBridgeState(editor);

  const tools: Tool[] = [
    { kind: 'icon', icon: 'undo', label: 'Undo', disabled: !state.canUndo, onPress: () => editor.undo() },
    { kind: 'icon', icon: 'redo', label: 'Redo', disabled: !state.canRedo, onPress: () => editor.redo() },
    { kind: 'divider' },
    { kind: 'icon', icon: 'format-bold', label: 'Bold', active: state.isBoldActive, onPress: () => editor.toggleBold() },
    { kind: 'icon', icon: 'format-italic', label: 'Italic', active: state.isItalicActive, onPress: () => editor.toggleItalic() },
    { kind: 'icon', icon: 'format-underlined', label: 'Underline', active: state.isUnderlineActive, onPress: () => editor.toggleUnderline() },
    { kind: 'icon', icon: 'format-strikethrough', label: 'Strikethrough', active: state.isStrikeActive, onPress: () => editor.toggleStrike() },
    { kind: 'icon', icon: 'highlight', label: 'Highlight', active: !!state.activeHighlight, onPress: () => editor.toggleHighlight(EditorHighlight) },
    { kind: 'divider' },
    { kind: 'text', text: 'H1', label: 'Heading 1', active: state.headingLevel === 1, onPress: () => editor.toggleHeading(1) },
    { kind: 'text', text: 'H2', label: 'Heading 2', active: state.headingLevel === 2, onPress: () => editor.toggleHeading(2) },
    { kind: 'text', text: 'H3', label: 'Heading 3', active: state.headingLevel === 3, onPress: () => editor.toggleHeading(3) },
    { kind: 'divider' },
    { kind: 'icon', icon: 'format-list-bulleted', label: 'Bullet list', active: state.isBulletListActive, onPress: () => editor.toggleBulletList() },
    { kind: 'icon', icon: 'format-list-numbered', label: 'Numbered list', active: state.isOrderedListActive, onPress: () => editor.toggleOrderedList() },
    { kind: 'icon', icon: 'checklist', label: 'Checklist', active: state.isTaskListActive, onPress: () => editor.toggleTaskList() },
    { kind: 'divider' },
    { kind: 'icon', icon: 'format-quote', label: 'Quote', active: state.isBlockquoteActive, onPress: () => editor.toggleBlockquote() },
    { kind: 'icon', icon: 'code', label: 'Code', active: state.isCodeActive, onPress: () => editor.toggleCode() },
    { kind: 'divider' },
    { kind: 'icon', icon: 'image', label: 'Insert image', onPress: onInsertImage },
  ];

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: withAlpha(colors.outlineVariant, 0.4) }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}>
        {tools.map((tool, i) =>
          tool.kind === 'divider' ? (
            <View
              key={`d${i}`}
              style={[styles.divider, { backgroundColor: withAlpha(colors.outlineVariant, 0.5) }]}
            />
          ) : (
            <ToolButton key={tool.label} tool={tool} colors={colors} />
          )
        )}
      </ScrollView>
    </View>
  );
}

/** A single tappable formatting control — icon or "H1"-style text label. Tints
 *  accent + gains a soft fill when active; dims when disabled (undo/redo). */
function ToolButton({ tool, colors }: { tool: Exclude<Tool, { kind: 'divider' }>; colors: Colors }) {
  const active = 'active' in tool && tool.active;
  const disabled = tool.kind === 'icon' && !!tool.disabled;
  const tint = active ? colors.secondary : colors.onSurfaceVariant;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={tool.label}
      accessibilityState={{ selected: !!active, disabled }}
      activeOpacity={0.7}
      disabled={disabled}
      onPress={tool.onPress}
      className="h-9 min-w-9 items-center justify-center rounded-btn px-2"
      style={[active ? { backgroundColor: withAlpha(colors.secondary, 0.14) } : null, disabled ? styles.disabled : null]}>
      {tool.kind === 'text' ? (
        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: tint }}>{tool.text}</Text>
      ) : (
        <AppIcon name={tool.icon} size={20} color={tint} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  disabled: {
    opacity: 0.35,
  },
});
