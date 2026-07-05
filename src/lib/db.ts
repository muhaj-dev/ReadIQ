// SQLite helpers — the single place raw SQL lives. Screens and stores call these
// functions, never SQL directly (see AGENTS.md → Database Rules).

import * as SQLite from 'expo-sqlite';

import type { Note, NoteAttachment, NoteComment, NoteSource } from '@/types/note';

const DB_NAME = 'noteiq.db';

// The notes table mirrors AGENTS.md's schema, plus a `tags` JSON column so the
// editor's topic tags survive a save. The `subjects` table remembers courses the
// student typed in the editor so they reappear in the picker next session.
const SCHEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS notes (
    id         TEXT PRIMARY KEY NOT NULL,
    title      TEXT NOT NULL,
    subject    TEXT,
    content    TEXT NOT NULL,
    source     TEXT NOT NULL,
    tags       TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subjects (
    name       TEXT PRIMARY KEY NOT NULL,
    created_at TEXT NOT NULL
  );
`;

// Open + migrate exactly once; every helper awaits this so ordering never matters.
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Add columns introduced after the first schema shipped. CREATE TABLE IF NOT
 *  EXISTS can't alter an existing `notes` table, so add missing columns by hand. */
async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info('notes')");
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('content_html')) {
    await db.execAsync('ALTER TABLE notes ADD COLUMN content_html TEXT');
  }
  if (!names.has('attachments')) {
    await db.execAsync("ALTER TABLE notes ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'");
  }
  // Reader annotations: highlighted/commented HTML + the comment bodies.
  if (!names.has('reader_html')) {
    await db.execAsync('ALTER TABLE notes ADD COLUMN reader_html TEXT');
  }
  if (!names.has('comments')) {
    await db.execAsync("ALTER TABLE notes ADD COLUMN comments TEXT NOT NULL DEFAULT '[]'");
  }
  // AI summary of the note's own text (upload flow fills it; null otherwise).
  if (!names.has('ai_summary')) {
    await db.execAsync('ALTER TABLE notes ADD COLUMN ai_summary TEXT');
  }
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA);
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

type NoteRow = {
  id: string;
  title: string;
  subject: string | null;
  content: string;
  content_html: string | null;
  source: string;
  tags: string;
  attachments: string | null;
  reader_html: string | null;
  comments: string | null;
  ai_summary: string | null;
  created_at: string;
};

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function parseAttachments(raw: string | null): NoteAttachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NoteAttachment[]) : [];
  } catch {
    return [];
  }
}

function parseComments(raw: string | null): NoteComment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NoteComment[]) : [];
  } catch {
    return [];
  }
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    content: row.content,
    contentHtml: row.content_html ?? null,
    source: row.source as NoteSource,
    tags: parseTags(row.tags),
    attachments: parseAttachments(row.attachments),
    readerHtml: row.reader_html ?? null,
    comments: parseComments(row.comments),
    aiSummary: row.ai_summary ?? null,
    createdAt: row.created_at,
  };
}

export async function insertNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO notes (id, title, subject, content, content_html, source, tags, attachments, reader_html, comments, ai_summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    note.id,
    note.title,
    note.subject,
    note.content,
    note.contentHtml,
    note.source,
    JSON.stringify(note.tags),
    JSON.stringify(note.attachments),
    note.readerHtml,
    JSON.stringify(note.comments),
    note.aiSummary,
    note.createdAt,
  );
}

/** Every saved note, newest first — the Memory Panel's source of truth. */
export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY created_at DESC');
  return rows.map(rowToNote);
}

export async function getNoteById(id: string): Promise<Note | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', id);
  return row ? rowToNote(row) : null;
}

export async function updateNote(
  id: string,
  fields: {
    title: string;
    subject: string | null;
    content: string;
    contentHtml: string | null;
    tags: string[];
    attachments: NoteAttachment[];
    readerHtml: string | null;
    comments: NoteComment[];
  },
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET title = ?, subject = ?, content = ?, content_html = ?, tags = ?, attachments = ?, reader_html = ?, comments = ? WHERE id = ?',
    fields.title,
    fields.subject,
    fields.content,
    fields.contentHtml,
    JSON.stringify(fields.tags),
    JSON.stringify(fields.attachments),
    fields.readerHtml,
    JSON.stringify(fields.comments),
    id,
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}

/** Custom subjects/courses the student added, oldest first. */
export async function listSubjects(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ name: string }>('SELECT name FROM subjects ORDER BY created_at ASC');
  return rows.map((r) => r.name);
}

export async function insertSubject(name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR IGNORE INTO subjects (name, created_at) VALUES (?, ?)',
    name,
    new Date().toISOString(),
  );
}
