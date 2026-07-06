// Retrieval — the trust engine behind "answers only from your notes".
// Chunk notes, score by IDF-weighted keyword overlap (lexical — no embedding
// model), gate best-first top-K. Empty result = honest "not in your notes"; Ask
// must not call the model then. IDF makes rare topic words dominate over filler.
// Pure helpers (chunkText, tokenize, rankChunks) are exported for tests + reuse.

import { useNotesStore } from '@/store/use-notes-store';
import type { Note } from '@/types/note';
import type { NoteChunk, RetrievalHit } from '@/types/retrieval';

/** Roughly a few sentences per chunk so a citation points to a precise place. */
const CHUNK_WORDS = 60;
/** Sentences of overlap between chunks, so a boundary match isn't lost. */
const CHUNK_OVERLAP = 1;
/** Grounding gate: minimum weighted-overlap score to count as a real match. */
const MIN_SCORE = 0.2;
/** Relative gate: drop chunks scoring below this fraction of the best score. */
const REL_RATIO = 0.55;

// Stopwords carry no topic signal. Includes instructional filler ("explain",
// "define", …) common to exam questions, which would otherwise match anything.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'is',
  'are', 'was', 'were', 'be', 'been', 'it', 'its', 'this', 'that', 'these', 'those',
  'as', 'by', 'with', 'from', 'into', 'about', 'what', 'which', 'who', 'how', 'why',
  'when', 'where', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'i', 'you',
  'me', 'my', 'we', 'they', 'them', 'their', 'so', 'if', 'then', 'than', 'there',
  // instructional / filler words
  'explain', 'define', 'describe', 'discuss', 'list', 'outline', 'summarize',
  'summarise', 'identify', 'state', 'give', 'tell', 'mention', 'provide', 'show',
  'main', 'also', 'using', 'use', 'used', 'some', 'any', 'many', 'much', 'more',
  'most', 'such', 'each', 'between', 'within', 'during', 'need', 'want', 'get',
]);

/** Light suffix folding so singular/plural & simple inflections match during
 *  retrieval ("communication" ↔ "communications", "studies" ↔ "study"). Only
 *  widens matching — it never invents overlap, so the grounding gate stays honest. */
function foldSuffix(token: string): string {
  if (token.length <= 4) return token; // too short to fold safely
  if (token.endsWith('ies')) return `${token.slice(0, -3)}y`; // studies → study
  if (token.endsWith('ss')) return token; // class, process — the 's' isn't a plural
  if (token.endsWith('s')) return token.slice(0, -1); // communications → communication
  return token;
}

/** Lowercase alphanumeric tokens, minus stopwords and single characters, each
 *  suffix-folded so a query matches a note that only differs by plural form. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(foldSuffix);
}

// Split into sentences without lookbehind (Hermes-safe).
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
    // Flush before overflow, carrying the tail sentence(s) forward as overlap.
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

/** Chunk one saved note, tagging every chunk with its source for citations.
 *  The title + subject lead the searchable text so a topic named only in the
 *  title (e.g. "Data Communications") is still found by a short question. */
export function chunkNote(note: Note): NoteChunk[] {
  const header = [note.title, note.subject].filter(Boolean).join(' ').trim();
  const searchable = header ? `${header}.\n${note.content}` : note.content;
  return chunkText(searchable).map((text) => ({
    noteId: note.id,
    noteTitle: note.title,
    text,
  }));
}

type Idf = { weight: Map<string, number>; fallback: number };

/** IDF across chunks: distinctive terms weigh high, filler low. `fallback` weights
 *  a query term absent from every note (correctly makes matching harder). */
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

// Weighted-overlap score in [0, 1]: question weight the chunk covers, plus a small
// density nudge. Matching the rare topic word beats matching several filler words.
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

/** Top-K note chunks for a question, best-first (absolute + REL_RATIO relative gate).
 *  Returns `[]` when nothing clears the gate — caller shows the honest fallback.
 *  Async so it stays awaitable if an embedding model later appears. */
export async function retrieveTopK(query: string, k = 4): Promise<RetrievalHit[]> {
  const { notes } = useNotesStore.getState();
  const chunks = notes.flatMap(chunkNote);
  const ranked = rankChunks(query, chunks);
  if (ranked.length === 0) return [];

  const cutoff = ranked[0].score * REL_RATIO;
  return ranked.filter((hit) => hit.score >= cutoff).slice(0, k);
}
