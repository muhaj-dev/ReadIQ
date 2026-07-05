// The saved-note domain model — the app's source of truth (stored in SQLite).
// Kept deliberately small; AI-derived fields (summary, topics) are computed in
// later phases, never persisted as if the student wrote them.

/** How the note entered the app — drives the source badge + icon. */
export type NoteSource = 'paste' | 'file' | 'scan' | 'voice';

/** A file/image the student attached to a note (shown in the Attachments list). */
export type NoteAttachmentKind = 'image' | 'file';

export type NoteAttachment = {
  id: string;
  /** Display name, e.g. "week4-notes.pdf" or "Lecture photo". */
  name: string;
  /** Meta line for the card, e.g. "PDF • 2.4 MB" or "Image". */
  meta: string;
  /** Local uri (file:// / cache) used to preview an image or open a file. */
  uri: string;
  kind: NoteAttachmentKind;
  /** MIME type reported by the picker (e.g. "application/pdf"). Used to detect a
   *  PDF reliably even when the filename/uri has no `.pdf` extension (Android). */
  mimeType?: string;
};

/** A margin note the student attached to a passage while reading (the reader's
 *  comment markers). `quote` is the text it's anchored to; `body` is what they
 *  wrote. The anchor itself lives as a `<mark data-cid>` inside `readerHtml`. */
export type NoteComment = {
  id: string;
  quote: string;
  body: string;
  createdAt: string;
};

export type Note = {
  id: string;
  title: string;
  subject: string | null;
  /** Plain-text projection — the grounding/retrieval source of truth. */
  content: string;
  /** Rich HTML from the editor (bold, inline images). Null for legacy notes. */
  contentHtml: string | null;
  source: NoteSource;
  /** Free-form topic tags the student added in the editor. */
  tags: string[];
  /** Files/images attached to the note. */
  attachments: NoteAttachment[];
  /** Reader HTML with highlights/comment anchors baked in as `<mark>`s. Null
   *  until the student annotates in the reader — then it's derived from the note
   *  content once and mutated in place. Kept separate from `contentHtml` so
   *  grounding/editing stay on the clean source text. */
  readerHtml: string | null;
  /** Bodies of the reader's comment markers, keyed by their anchor's data-cid. */
  comments: NoteComment[];
  /** AI Summary of THIS note's own text, generated once through the BTL runtime
   *  (grounded in the note — never outside knowledge). Null until generated; the
   *  Note Details screen shows an honest placeholder while it's null. */
  aiSummary: string | null;
  /** ISO timestamp of when the note was saved. */
  createdAt: string;
};

/** What a screen passes to `addNote` — id/title/createdAt are filled in by the store. */
export type NoteInput = {
  title?: string;
  subject?: string | null;
  content: string;
  contentHtml?: string | null;
  source: NoteSource;
  tags?: string[];
  attachments?: NoteAttachment[];
  /** Pre-generated AI summary (upload flow summarizes at save time). */
  aiSummary?: string | null;
};

/** Fields that Edit Note (and the reader's annotations) may change. */
export type NotePatch = Partial<
  Pick<
    Note,
    | 'title'
    | 'subject'
    | 'content'
    | 'contentHtml'
    | 'tags'
    | 'attachments'
    | 'readerHtml'
    | 'comments'
    | 'aiSummary'
  >
>;
