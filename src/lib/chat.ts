// Grounded Ask ★ — the star feature. Answers come ONLY from the student's own
// retrieved notes, and every grounded answer carries the source notes as
// citations (the "📌 From your notes" tags).
//
// The flow (see AGENTS.md → Retrieval & Grounding Rules):
//   1. retrieve the top note chunks for the question (lexical — lib/retrieval)
//   2. if NOTHING clears the gate → return the honest fallback WITHOUT calling the
//      model (this saves BTL credits and is the trust promise in action)
//   3. otherwise stream the answer with the retrieved chunks as the SOLE context
//   4. return the source notes as citations
//
// The model is also told to decline when the chunks don't actually answer; if it
// does, we drop the citations so a non-answer is never tagged as "from your notes".

import { useNotesStore } from '@/store/use-notes-store';
import type { Citation } from '@/types/chat';
import type { RetrievalHit } from '@/types/retrieval';

import { btlChatStream, btlPost, BtlError, DEFAULT_CHAT_MODEL } from './btl';
import { retrieveTopK } from './retrieval';

/** The exact sentence the model is told to use — and the fallback we show — when
 *  the notes don't cover the question. Kept identical everywhere so we can detect
 *  a declined answer and strip its citations. */
export const NOT_IN_NOTES = "I don't have that in your notes yet.";

/** Shown when the student hasn't saved a single note yet (nudge to add one). */
export const NO_NOTES_YET =
  "You haven't saved any notes yet. Add your first note and I'll answer straight from it.";

const SYSTEM_PROMPT =
  'You are noteIQ, a calm university study companion. Answer the student\'s ' +
  'question using ONLY the numbered notes provided below. If the notes do not ' +
  `contain the answer, reply exactly: "${NOT_IN_NOTES}" and nothing else. Never ` +
  'use outside knowledge and never invent facts.\n\n' +
  'Format the answer so a tired student can read it at a glance:\n' +
  '- Start with one short sentence that directly answers the question.\n' +
  '- When there are several points, steps, or items, put each on its own line ' +
  'as a "- " bullet — never cram them into one long paragraph.\n' +
  '- For a sequence of steps, use a numbered list ("1. ", "2. ").\n' +
  '- You may introduce a group of bullets with a short "**Label:**" line.\n' +
  '- Bold the key term of a point with **double asterisks**.\n' +
  '- Be concise: no preamble, no repetition, and do NOT use markdown headings (#).';

export type AskResult = {
  /** True only when a real answer was drawn from retrieved notes. */
  grounded: boolean;
  content: string;
  citations: Citation[];
};

type ChatCompletion = { choices?: { message?: { content?: string } }[] };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A transient runtime failure worth retrying (a 5xx gateway hiccup or a dropped
 *  connection) — as opposed to auth / credits / not-configured, which won't fix
 *  themselves on a retry. */
function isTransient(err: unknown): err is BtlError {
  return err instanceof BtlError && (err.kind === 'server' || err.kind === 'network');
}

/**
 * Get the answer text for a prepared chat request, resilient to the BTL runtime's
 * intermittent streaming 500s.
 *
 * Attempt 1 streams (the hero moment — the answer types itself out). If that fails
 * transiently BEFORE any token arrives, fall back to a normal non-streaming
 * completion, which the gateway serves far more reliably; the whole answer then
 * appears at once after the typing indicator. Once tokens have streamed we never
 * retry (it would duplicate them) — the error surfaces instead.
 */
async function generateAnswer(
  request: Record<string, unknown>,
  onToken: ((delta: string) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<string> {
  let emitted = false;
  const emit = (delta: string) => {
    emitted = true;
    onToken?.(delta);
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt === 0) {
        return (await btlChatStream(request, emit, signal)).trim();
      }
      const res = await btlPost<ChatCompletion>('chat/completions', request, signal);
      return (res.choices?.[0]?.message?.content ?? '').trim();
    } catch (err) {
      const lastAttempt = attempt === 2;
      if (emitted || !isTransient(err) || lastAttempt) throw err;
      await delay(500); // brief backoff, then retry as a non-streaming call
    }
  }
  return ''; // unreachable — the loop always returns or throws
}

/** Build one citation per unique source note (hits arrive best-first). */
function toCitations(hits: RetrievalHit[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const hit of hits) {
    if (seen.has(hit.noteId)) continue;
    seen.add(hit.noteId);
    citations.push({
      noteId: hit.noteId,
      noteTitle: hit.noteTitle,
      snippet: hit.text.slice(0, 160).trim(),
    });
  }
  return citations;
}

/**
 * Answer a question strictly from the student's saved notes.
 *
 * `onToken` receives each streamed delta so the UI can type the answer out live;
 * `signal` cancels an in-flight stream. Resolves to an {@link AskResult}; throws a
 * BtlError only on a runtime failure (the caller shows `.friendly`).
 */
export async function askFromNotes(
  question: string,
  opts: { onToken?: (delta: string) => void; signal?: AbortSignal } = {},
): Promise<AskResult> {
  const q = question.trim();
  if (!q) return { grounded: false, content: NOT_IN_NOTES, citations: [] };

  // The gate: retrieve first. No hit → no model call, honest fallback.
  const hits = await retrieveTopK(q, 4);
  if (hits.length === 0) {
    const hasNotes = useNotesStore.getState().notes.length > 0;
    return { grounded: false, content: hasNotes ? NOT_IN_NOTES : NO_NOTES_YET, citations: [] };
  }

  const context = hits.map((h, i) => `[${i + 1}] ${h.noteTitle}\n${h.text}`).join('\n\n');
  const request = {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.2,
    max_tokens: 500,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Notes:\n${context}\n\nQuestion: ${q}` },
    ],
  };
  const content = await generateAnswer(request, opts.onToken, opts.signal);
  // Honour the model declining: an empty or "not in your notes" reply is NOT
  // grounded, so we show no source tags under it.
  const declined = content.toLowerCase().startsWith("i don't have that in your notes");
  if (!content || declined) {
    return { grounded: false, content: content || NOT_IN_NOTES, citations: [] };
  }

  return { grounded: true, content, citations: toCitations(hits) };
}
