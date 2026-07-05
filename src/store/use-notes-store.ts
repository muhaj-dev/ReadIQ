// The Memory store — every saved note, loaded from SQLite and kept in sync.
// This is the client-side source of truth the Memory Panel, Note Details, and
// (later) retrieval read from.

import { create } from 'zustand';

import * as db from '@/lib/db';
import type { Note, NoteInput, NotePatch } from '@/types/note';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fall back to the first non-empty line when the student leaves the title blank. */
function deriveTitle(content: string): string {
  const firstLine = content.split('\n').map((line) => line.trim()).find(Boolean) ?? '';
  return firstLine.slice(0, 60).trim() || 'Untitled note';
}

type NotesState = {
  notes: Note[];
  loaded: boolean;
  /** Load persisted notes once on app start. */
  init: () => Promise<void>;
  addNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, patch: NotePatch) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loaded: false,

  init: async () => {
    if (get().loaded) return;
    try {
      const notes = await db.listNotes();
      set({ notes, loaded: true });
    } catch (err) {
      // Never crash the app over storage — start empty and let saves retry.
      console.warn('[notes] failed to load from SQLite', err);
      set({ loaded: true });
    }
  },

  addNote: async (input) => {
    const note: Note = {
      id: createId(),
      title: input.title?.trim() || deriveTitle(input.content),
      subject: input.subject ?? null,
      content: input.content,
      contentHtml: input.contentHtml ?? null,
      source: input.source,
      tags: input.tags ?? [],
      attachments: input.attachments ?? [],
      // Reader annotations start empty; they're derived on first highlight/comment.
      readerHtml: null,
      comments: [],
      aiSummary: input.aiSummary ?? null,
      createdAt: new Date().toISOString(),
    };
    try {
      await db.insertNote(note);
    } catch (err) {
      console.warn('[notes] failed to persist note', err);
    }
    // Optimistic: show the note immediately even if the write hiccuped.
    set((state) => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: async (id, patch) => {
    const current = get().notes.find((n) => n.id === id);
    if (!current) return;
    // Editing the note's text (an Edit-screen save that carries contentHtml, not
    // readerHtml) re-anchors nothing — the old highlights/comments pointed at the
    // previous HTML — so clear them and let the reader re-derive from fresh text.
    const contentEdited = patch.contentHtml !== undefined && patch.readerHtml === undefined;
    const next: Note = {
      ...current,
      title: patch.title?.trim() || current.title,
      subject: patch.subject !== undefined ? patch.subject : current.subject,
      content: patch.content ?? current.content,
      contentHtml: patch.contentHtml !== undefined ? patch.contentHtml : current.contentHtml,
      tags: patch.tags ?? current.tags,
      attachments: patch.attachments ?? current.attachments,
      readerHtml: contentEdited
        ? null
        : patch.readerHtml !== undefined
          ? patch.readerHtml
          : current.readerHtml,
      comments: contentEdited ? [] : patch.comments ?? current.comments,
      // The AI summary isn't a column in db.updateNote, so SQLite keeps its value
      // across edits — mirror that here (a patch may still override it explicitly).
      aiSummary: patch.aiSummary !== undefined ? patch.aiSummary : current.aiSummary,
    };
    try {
      await db.updateNote(id, {
        title: next.title,
        subject: next.subject,
        content: next.content,
        contentHtml: next.contentHtml,
        tags: next.tags,
        attachments: next.attachments,
        readerHtml: next.readerHtml,
        comments: next.comments,
      });
    } catch (err) {
      console.warn('[notes] failed to update note', err);
    }
    set((state) => ({ notes: state.notes.map((n) => (n.id === id ? next : n)) }));
  },

  removeNote: async (id) => {
    try {
      await db.deleteNote(id);
    } catch (err) {
      console.warn('[notes] failed to delete note', err);
    }
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  getNote: (id) => get().notes.find((n) => n.id === id),
}));
