// Parses noteIQ's answer text into the light block structure the model is asked
// to produce (see lib/chat.ts SYSTEM_PROMPT): short paragraphs, "- " bullets,
// "1." numbered steps, "**Label:**" section lines, and inline **bold** key terms.
// It is a tiny, forgiving markdown subset — enough to make a dense answer
// scannable without a heavy dependency. Partial/streaming markdown degrades
// gracefully to plain text.
//
// A "**Label:**" line and the content beneath it are grouped into a "section"
// (rendered as a bordered inner card) so a multi-part answer reads like the mock:
// intro paragraph, one card per section, optional closing paragraph.

/** A leaf block — the pieces that make up a paragraph, list, or a section's body. */
export type Leaf =
  | { kind: 'para'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'ordered'; items: string[] };

/** A section: an accent title over its body leaves (rendered as a card). */
export type Section = { kind: 'section'; title: string; body: Leaf[] };

export type Block = Leaf | { kind: 'label'; text: string } | Section;

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

/**
 * Fold each "**Label:**" line and the content beneath it into a section.
 * A section absorbs the leaves that follow its label up to the next label. If a
 * section runs to the very end of the answer and its last leaf is a standalone
 * paragraph, that paragraph is left OUTSIDE the section — it reads as the
 * answer's closing line (matching the mock: intro · section cards · closing).
 */
function groupSections(blocks: Block[]): Block[] {
  const out: Block[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.kind !== 'label') {
      out.push(block);
      continue;
    }

    const body: Leaf[] = [];
    let j = i + 1;
    for (; j < blocks.length && blocks[j].kind !== 'label'; j += 1) {
      body.push(blocks[j] as Leaf);
    }

    // A label with no content beneath it (e.g. mid-stream, or a stray heading)
    // stays a plain bold heading rather than becoming an empty card.
    if (body.length === 0) {
      out.push(block);
      i = j - 1;
      continue;
    }

    const reachedEnd = j >= blocks.length;
    const trailing =
      reachedEnd && body.length > 1 && body[body.length - 1].kind === 'para'
        ? body.pop()
        : undefined;

    out.push({ kind: 'section', title: block.text, body });
    if (trailing) out.push(trailing);
    i = j - 1;
  }

  return out;
}

/** Parse answer text into render-ready blocks (paragraphs, lists, section cards). */
export function parseAnswer(text: string): Block[] {
  return groupSections(parseBlocks(text));
}
