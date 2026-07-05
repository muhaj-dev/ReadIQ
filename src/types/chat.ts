// Chat domain types for the ASK tab — the grounded Q&A conversation.
//
// A message is "grounded" only when retrieval backed the answer with real note
// chunks; `citations` are what drive the "📌 From your notes" tags — the app's
// visible proof of trust. The honest "not in your notes" fallback and any runtime
// error are NOT grounded and carry no citations.

export type Role = 'user' | 'assistant';

/** A saved note an answer was drawn from — rendered as a "From your notes" tag. */
export type Citation = {
  noteId: string;
  noteTitle: string;
  /** A short slice of the source chunk (for preview / context). */
  snippet: string;
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  /** True only when the answer was backed by retrieved notes (never for the
   *  honest fallback or a runtime error). */
  grounded: boolean;
  /** Source notes for a grounded answer → the "From your notes" tags. */
  citations: Citation[];
  /** The assistant reply is still streaming in (drives the typing indicator). */
  streaming?: boolean;
  /** The reply is a friendly runtime-error message, not a real answer. */
  error?: boolean;
  createdAt: string;
};

/**
 * A saved conversation, shown in the Ask history list. Each session persists to
 * SQLite so a student can reopen a past chat. `preview` is the first question
 * asked (the list subtitle); `messageCount` counts all turns in the thread.
 */
export type ChatSession = {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};
