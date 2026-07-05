// Reader-annotation state + persistence for the Note Reader. Holds the current
// tool (view / highlight / comment), the highlight colour, the comment being
// written or viewed, an undo/redo history, and writes every change back to the
// Memory store. The WebView owns the DOM; this hook owns the saved shape. Kept
// out of the screen so the reader screen only composes UI (see AGENTS.md →
// file-length rules).

import { useCallback, useRef, useState } from 'react';

import type { NoteDetail } from '@/data/note-detail';
import { ReaderHighlights } from '@/constants/theme';
import { useNotesStore } from '@/store/use-notes-store';
import type { NoteComment } from '@/types/note';

/** The active reading tool. `view` = plain reading (text still selectable). */
export type AnnotationMode = 'view' | 'highlight' | 'comment';

/** A fresh comment selection whose body the student is still typing. Its anchor
 *  `<mark data-cid>` already exists in the WebView DOM (captured in `html`); that
 *  data-cid is reused as the comment's id, so both stay in sync. */
export type CommentDraft = { cid: string; quote: string; html: string };

/** One point on the undo timeline: the reader HTML + comment list at that step. */
type Snapshot = { html: string; comments: NoteComment[] };

/** Cheap structural equality so the history only records real changes. */
function sameComments(a: NoteComment[], b: NoteComment[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => b[i] && c.id === b[i].id && c.body === b[i].body && c.quote === b[i].quote);
}

export function useNoteAnnotations(note: NoteDetail) {
  const updateNote = useNotesStore((s) => s.updateNote);

  // The WebView renders this HTML once; never fed back, or the page would reset
  // mid-read. Later highlights/comments mutate the DOM and report new HTML.
  const initialHtml = useRef(note.readerHtml).current;

  // Refs mirror state so async persistence always saves a consistent html+comments
  // pair regardless of React batching.
  const htmlRef = useRef(note.readerHtml);
  const commentsRef = useRef<NoteComment[]>(note.comments);

  // Undo/redo timeline. `past`/`future` hold snapshots; the state flags drive the
  // enabled/disabled look of the history buttons.
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  // A delete waiting on the WebView to unwrap its mark, so the mark removal and
  // the comment removal commit together as ONE undo step (see onChangeHtml).
  const pendingDeleteRef = useRef<string | null>(null);

  const [comments, setComments] = useState<NoteComment[]>(note.comments);
  const [mode, setMode] = useState<AnnotationMode>('view');
  const [highlightColor, setHighlightColor] = useState<string>(ReaderHighlights[0]);
  const [draft, setDraft] = useState<CommentDraft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistory = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  // Write a state to refs + React + the store. Does NOT touch history.
  const write = useCallback(
    (html: string, next: NoteComment[]) => {
      htmlRef.current = html;
      commentsRef.current = next;
      setComments(next);
      updateNote(note.id, { readerHtml: html, comments: next });
    },
    [note.id, updateNote],
  );

  // A user-driven change: record the pre-change state on the undo stack (only if
  // something actually changed), drop the redo stack, then write the new state.
  const persist = useCallback(
    (html: string, next: NoteComment[]) => {
      if (html !== htmlRef.current || !sameComments(next, commentsRef.current)) {
        pastRef.current.push({ html: htmlRef.current, comments: commentsRef.current });
        futureRef.current = [];
        syncHistory();
      }
      write(html, next);
    },
    [write, syncHistory],
  );

  // ── WebView message handlers ──────────────────────────────────────────────

  /** A highlight was added/removed, OR a pending comment delete's mark just came
   *  out. Fold a pending delete in here so mark + body vanish as one undo step. */
  const onChangeHtml = useCallback(
    (html: string) => {
      const pending = pendingDeleteRef.current;
      if (pending) {
        pendingDeleteRef.current = null;
        persist(html, commentsRef.current.filter((c) => c.id !== pending));
      } else {
        persist(html, commentsRef.current);
      }
    },
    [persist],
  );

  /** The student selected text with the comment tool — open the editor. */
  const onRequestComment = useCallback(
    (cid: string, quote: string, html: string) => setDraft({ cid, quote, html }),
    [],
  );

  /** They tapped an existing comment marker — open it to read/edit/delete. */
  const onOpenComment = useCallback((cid: string) => setOpenId(cid), []);

  // ── Comment editor actions (the screen wires these to the modal) ──────────

  /** Save a brand-new comment; its anchor mark is already in `draft.html`. */
  const saveDraft = useCallback(
    (body: string) => {
      if (!draft) return;
      const next = [
        ...commentsRef.current,
        { id: draft.cid, quote: draft.quote, body: body.trim(), createdAt: new Date().toISOString() },
      ];
      persist(draft.html, next);
      setDraft(null);
    },
    [draft, persist],
  );

  /** Cancel a new comment. Returns the anchor's cid so the screen can unwrap it
   *  in the WebView (that unwrap fires a change event which persists clean HTML). */
  const discardDraft = useCallback((): string | null => {
    const cid = draft?.cid ?? null;
    setDraft(null);
    return cid;
  }, [draft]);

  /** Edit an existing comment's body (the anchor mark stays where it is). */
  const saveEdit = useCallback(
    (id: string, body: string) => {
      const next = commentsRef.current.map((cmt) =>
        cmt.id === id ? { ...cmt, body: body.trim() } : cmt,
      );
      persist(htmlRef.current, next);
      setOpenId(null);
    },
    [persist],
  );

  /** Remove a comment. Marks it pending and closes the sheet; the screen then
   *  unwraps its mark, and onChangeHtml commits both together (one undo step). */
  const removeComment = useCallback((id: string) => {
    pendingDeleteRef.current = id;
    setOpenId(null);
  }, []);

  const closeOpen = useCallback(() => setOpenId(null), []);

  // ── Undo / redo ───────────────────────────────────────────────────────────

  /** Step back one change. Returns the HTML the screen must push into the
   *  WebView, or null when there's nothing to undo. */
  const undo = useCallback((): string | null => {
    const prev = pastRef.current.pop();
    if (!prev) return null;
    futureRef.current.push({ html: htmlRef.current, comments: commentsRef.current });
    write(prev.html, prev.comments);
    syncHistory();
    // Any open editor/draft is stale after a jump — close it.
    setDraft(null);
    setOpenId(null);
    pendingDeleteRef.current = null;
    return prev.html;
  }, [write, syncHistory]);

  /** Step forward one undone change. Returns the HTML to push into the WebView. */
  const redo = useCallback((): string | null => {
    const next = futureRef.current.pop();
    if (!next) return null;
    pastRef.current.push({ html: htmlRef.current, comments: commentsRef.current });
    write(next.html, next.comments);
    syncHistory();
    setDraft(null);
    setOpenId(null);
    pendingDeleteRef.current = null;
    return next.html;
  }, [write, syncHistory]);

  const openedComment = openId ? comments.find((c) => c.id === openId) ?? null : null;

  return {
    initialHtml,
    comments,
    mode,
    setMode,
    highlightColor,
    setHighlightColor,
    onChangeHtml,
    onRequestComment,
    onOpenComment,
    draft,
    openedComment,
    saveDraft,
    discardDraft,
    saveEdit,
    removeComment,
    closeOpen,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
