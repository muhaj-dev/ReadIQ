// Chat domain types for the ASK tab — the grounded Q&A conversation.

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
  /** True only when the answer was backed by retrieved notes. */
  grounded: boolean;
  /** Source notes for a grounded answer → the "From your notes" tags. */
  citations: Citation[];
  /** The assistant reply is still streaming in (drives the typing indicator). */
  streaming?: boolean;
  /** The answer hit the length cap mid-flow — there is more to say. Live-only. */
  truncated?: boolean;
  /** Set once a continuation finds nothing more — retires "Generate more". Live-only. */
  exhausted?: boolean;
  /** A "Generate more" continuation is in flight for this answer (button → spinner). */
  continuing?: boolean;
  /** Answer drawn from general knowledge, outside the notes ("Beyond your notes"). */
  beyond?: boolean;
  /** The student already pulled an outside answer for this turn — hide the button. */
  beyondAsked?: boolean;
  /** The reply is a friendly runtime-error message, not a real answer. */
  error?: boolean;
  createdAt: string;
};

/** A saved conversation shown in the Ask history list (persisted to SQLite). */
export type ChatSession = {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};
