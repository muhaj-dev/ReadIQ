// Retrieval — the trust engine behind "answers only from your notes".
//
// The flow (see AGENTS.md → Retrieval & Grounding Rules):
//   1. split each note into small, overlapping chunks
//   2. score every chunk against the question by DISTINCTIVE keyword overlap
//      (lexical — the BTL catalog has no embedding model; see lib/btl.ts)
//   3. keep only chunks that clear the gate, best first, top-K
//   4. drop chunks far weaker than the best match, so a barely-related note is
//      never cited alongside a strongly-matching one
// An empty result is the honest "I don't have that in your notes yet." signal:
// Ask must NOT call the model when retrieveTopK returns nothing.
//
// Why IDF weighting: plain keyword overlap treats every shared word equally, so a
// note that merely repeats a filler word ("process", "explain") scores as high as
// one that shares the real topic word ("photosynthesis") — and gets cited even
// though it doesn't answer the question. Weighting each term by how RARE it is
// across the notes makes distinctive topic words dominate and common words count
// for almost nothing, which is what keeps citations honest.
//
// The pure helpers (chunkText, tokenize, rankChunks) are exported so they can be
// unit-tested and reused by quiz generation (Phase 6).

import { useNotesStore } from '@/store/use-notes-store';
import type { Note } from '@/types/note';
import type { NoteChunk, RetrievalHit } from '@/types/retrieval';

/** Roughly a few sentences per chunk so a citation points to a precise place. */
const CHUNK_WORDS = 60;
/** Sentences of overlap between neighbouring chunks, so a match near a boundary
 *  is never split across two chunks and lost. */
const CHUNK_OVERLAP = 1;
/** The grounding gate: a chunk must clear this weighted-overlap score to count as
 *  a real match. It drops chunks that share only common/filler words with the
 *  question — those are the off-topic citations we want gone. */
const MIN_SCORE = 0.2;
/** Relative gate: once we know the best chunk's score, drop any chunk scoring less
 *  than this fraction of it. A note under ~half as relevant as the top match is
 *  noise, and must never be tagged "From your notes" next to the real source. */
const REL_RATIO = 0.55;

// Common words carry no topic signal — dropping them keeps scoring about content.
// Beyond grammar words we also drop instructional filler ("explain", "define",
// "describe", "main", …): a study question is full of them, and left in they let
// an unrelated note match on "explain" alone.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'is',
  'are', 'was', 'were', 'be', 'been', 'it', 'its', 'this', 'that', 'these', 'those',
  'as', 'by', 'with', 'from', 'into', 'about', 'what', 'which', 'who', 'how', 'why',
  'when', 'where', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'i', 'you',
  'me', 'my', 'we', 'they', 'them', 'their', 'so', 'if', 'then', 'than', 'there',
  // instructional / filler words common to exam questions — no topic signal
  'explain', 'define', 'describe', 'discuss', 'list', 'outline', 'summarize',
  'summarise', 'identify', 'state', 'give', 'tell', 'mention', 'provide', 'show',
  'main', 'also', 'using', 'use', 'used', 'some', 'any', 'many', 'much', 'more',
  'most', 'such', 'each', 'between', 'within', 'during', 'need', 'want', 'get',
]);

/** Lowercase alphanumeric tokens, minus stopwords and single characters. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Split into sentences without lookbehind (kept Hermes-safe): break on line
// breaks, then on runs ending in sentence punctuation.
function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.match(/[^.!?]+[.!?]*/g) ?? [])
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Break note text into small, lightly-overlapping chunks (~CHUNK_WORDS each). */
export function chunkText(text: string): string[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const chunks: string[] = [];
  let current: string[] = [];
  let words = 0;
  const countWords = (parts: string[]) =>
    parts.reduce((n, s) => n + s.split(' ').length, 0);

  for (const sentence of sentences) {
    const w = sentence.split(' ').length;
    // Flush the current chunk before it overflows, carrying the tail sentence(s)
    // forward as overlap. A single over-long sentence flushes on the next pass.
    if (words + w > CHUNK_WORDS && current.length > 0) {
      chunks.push(current.join(' '));
      current = CHUNK_OVERLAP > 0 ? current.slice(-CHUNK_OVERLAP) : [];
      words = countWords(current);
    }
    current.push(sentence);
    words += w;
  }
  if (current.length > 0) chunks.push(current.join(' '));
  return chunks;
}

/** Chunk one saved note, tagging every chunk with its source for citations. */
export function chunkNote(note: Note): NoteChunk[] {
  return chunkText(note.content).map((text) => ({
    noteId: note.id,
    noteTitle: note.title,
    text,
  }));
}

type Idf = { weight: Map<string, number>; fallback: number };

/**
 * Inverse document frequency across the note chunks: how distinctive each term is.
 * A term in few chunks (a real topic word) gets a high weight; a term in nearly
 * every chunk (filler) gets a low one. `fallback` weights a query term that never
 * appears in any note — it can't be matched, so it only makes matching harder,
 * which is correct: a question about something absent should not ground anywhere.
 */
function buildIdf(corpus: string[][]): Idf {
  const df = new Map<string, number>();
  for (const terms of corpus) {
    for (const t of new Set(terms)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const n = corpus.length;
  const weight = new Map<string, number>();
  for (const [t, d] of df) weight.set(t, Math.log(1 + n / d));
  return { weight, fallback: Math.log(1 + n) };
}

// Weighted-overlap score in [0, 1]: the share of the question's DISTINCTIVE weight
// that the chunk actually covers, plus a small nudge for how densely the matched
// terms appear. Matching the rare topic word beats matching several filler words.
function scoreChunk(queryTerms: Set<string>, chunkTerms: string[], idf: Idf): number {
  if (queryTerms.size === 0 || chunkTerms.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const t of chunkTerms) counts.set(t, (counts.get(t) ?? 0) + 1);

  let totalWeight = 0;
  let matchedWeight = 0;
  let matchedHits = 0;
  for (const term of queryTerms) {
    const w = idf.weight.get(term) ?? idf.fallback;
    totalWeight += w;
    const c = counts.get(term) ?? 0;
    if (c > 0) {
      matchedWeight += w;
      matchedHits += c;
    }
  }
  if (totalWeight === 0) return 0;

  const coverage = matchedWeight / totalWeight;
  const density = Math.min(matchedHits / chunkTerms.length, 1);
  return coverage * 0.85 + density * 0.15;
}

/** Rank chunks against a question, keeping only those past the grounding gate. */
export function rankChunks(query: string, chunks: NoteChunk[]): RetrievalHit[] {
  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) return [];

  const corpus = chunks.map((chunk) => tokenize(chunk.text));
  const idf = buildIdf(corpus);

  return chunks
    .map((chunk, i) => ({ ...chunk, score: scoreChunk(queryTerms, corpus[i], idf) }))
    .filter((hit) => hit.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

/**
 * Top-K note chunks for a question, best first — the sole context Ask is allowed
 * to answer from. Returns `[]` when nothing clears the gate; the caller MUST then
 * show the honest "not in your notes" fallback instead of calling the model.
 *
 * After the absolute gate we apply a relative one: only chunks within REL_RATIO of
 * the best score survive, so a weakly-related note can't ride along as a citation.
 *
 * Async so Phase 4 can `await` it unchanged if an embedding model later appears.
 */
export async function retrieveTopK(query: string, k = 4): Promise<RetrievalHit[]> {
  const { notes } = useNotesStore.getState();
  const chunks = notes.flatMap(chunkNote);
  const ranked = rankChunks(query, chunks);
  if (ranked.length === 0) return [];

  const cutoff = ranked[0].score * REL_RATIO;
  return ranked.filter((hit) => hit.score >= cutoff).slice(0, k);
}
