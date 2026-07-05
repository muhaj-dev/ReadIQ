// Retrieval types — lexical grounding for Ask (no embedding model in the BTL catalog; ranked by keyword overlap).

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
