// Retrieval types — the lexical grounding layer that backs Ask (Phase 4).
//
// There are no embeddings here: the BTL catalog surfaced no text-embedding model
// (see lib/btl.ts), so note chunks are ranked by keyword overlap instead. The
// trust promise is kept by the retrieval GATE — an empty result means "not in
// your notes" — plus the citations built from each hit, not by vectors.

/** A small, retrievable slice of a saved note. */
export type NoteChunk = {
  noteId: string;
  noteTitle: string;
  text: string;
};

/** A ranked chunk — what retrieval returns and what a citation is built from. */
export type RetrievalHit = NoteChunk & {
  /** Lexical relevance in [0, 1]; higher means a stronger keyword match. */
  score: number;
};
