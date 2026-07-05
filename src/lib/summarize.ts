// Note → AI summary through the BTL runtime.
//
// The summary is GROUNDED in the note's own text: the model is told to use only
// what the note says and never add outside facts. This keeps the trust promise —
// the "AI Summary" on Note Details describes the student's material, nothing else.
//
// Budget note: this spends BTL credits, so callers summarize ONCE (at upload) and
// persist the result on the note (see use-notes-store). Never re-summarize.

import { btlPost, DEFAULT_CHAT_MODEL } from './btl';

type ChatResponse = {
  choices?: { message?: { content?: string } }[];
};

// Cap the input so a long PDF doesn't burn tokens — the opening pages carry the
// gist, and the summary only needs a couple of sentences.
const MAX_INPUT_CHARS = 6000;

const SYSTEM_PROMPT =
  'You are AI University Companion. Summarize ONLY the student\'s note below in ' +
  '2-3 short, calm sentences a student can skim before revising. Use only what the ' +
  'note says — never add outside facts, definitions, or opinions. Return only the ' +
  'summary text: no preamble, headings, bullet points, or markdown.';

/**
 * Summarize a note's plain text via the BTL runtime. Resolves to a trimmed
 * summary string (empty if the runtime returned nothing). Throws a BtlError on a
 * runtime failure — callers treat that as "no summary yet" and save the note
 * anyway, so a summary hiccup never blocks the note from being kept.
 */
export async function summarizeNoteText(content: string): Promise<string> {
  const text = content.trim();
  if (!text) return '';

  const res = await btlPost<ChatResponse>('chat/completions', {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.2,
    max_tokens: 180,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Note:\n${text.slice(0, MAX_INPUT_CHARS)}` },
    ],
  });

  return (res.choices?.[0]?.message?.content ?? '').trim();
}
