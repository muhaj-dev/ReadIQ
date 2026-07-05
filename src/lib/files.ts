import * as DocumentPicker from 'expo-document-picker';
import { File as FsFile } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import type { NoteAttachment } from '@/types/note';

/** A file the student picked from their device for a note attachment. */
export type PickedDocument = {
  name: string;
  /** Human meta line for the attachment card, e.g. "PDF • 2.4 MB". */
  meta: string;
  uri: string;
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extensionLabel = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
};

/** Unique-enough attachment id (app runtime, not a Workflow script). */
const attachmentId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** True for a picked PDF — the files we run text extraction on. Checks the
 *  picker's MIME type first (reliable), then falls back to the filename/meta,
 *  because Android often hands back a uri/name with no `.pdf` extension. */
export function isPdf(attachment: NoteAttachment): boolean {
  return (
    /pdf/i.test(attachment.mimeType ?? '') ||
    /\.pdf$/i.test(attachment.name) ||
    /^pdf\b/i.test(attachment.meta)
  );
}

/**
 * Read a local file (file:// / cache uri) into a base64 data URI, e.g.
 * "data:application/pdf;base64,…". This is what the BTL runtime's `file` content
 * part expects for document extraction. Uses fetch + FileReader so it needs no
 * extra native module. Rejects if the file can't be read.
 *
 * Pass `mimeType` to override the type baked into the data URI. This matters on
 * React Native: a cached document's blob often reports `application/octet-stream`
 * (or an empty type), and the runtime then can't tell it's a PDF and returns no
 * text — so PDF extraction forces `application/pdf` here.
 */
export async function fileUriToDataUri(uri: string, mimeType?: string): Promise<string> {
  // Preferred path: read the file straight to base64 via expo-file-system. On
  // native this is reliable, whereas RN's fetch(fileUri).blob() + FileReader
  // frequently returns EMPTY data on Android — the real cause of the PDF
  // "no content yet" bug. DocumentPicker copies to the cache (copyToCacheDirectory),
  // so `uri` is a file:// path the File API can read.
  try {
    const base64 = await new FsFile(uri).base64();
    if (base64) {
      console.log('[files] read via expo-file-system · base64 length:', base64.length);
      return `data:${mimeType ?? 'application/octet-stream'};base64,${base64}`;
    }
    console.warn('[files] expo-file-system returned empty base64 — falling back to fetch');
  } catch (err) {
    // Web blob: URIs (and any unexpected uri) land here — fall back to fetch.
    console.warn('[files] expo-file-system read failed, falling back to fetch:', String(err));
  }

  const res = await fetch(uri);
  const blob = await res.blob();
  const dataUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
  // Rewrite the "data:<type>;base64," prefix when the caller knows the real type,
  // so a wrong/empty blob type never makes the runtime skip a valid document.
  if (mimeType) return dataUri.replace(/^data:[^;,]*/, `data:${mimeType}`);
  return dataUri;
}

/**
 * Open the device file picker for a PDF / document and return its name, meta,
 * and uri. Resolves to null if the student cancels. Real text extraction
 * (a file → text call through the BTL runtime) lands in Phase 8 — for now the
 * picked file just becomes the note's attachment.
 */
export async function pickDocument(): Promise<PickedDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });

  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;

  const size = formatBytes(asset.size);
  const meta = size ? `${extensionLabel(asset.name)} • ${size}` : extensionLabel(asset.name);
  return { name: asset.name, meta, uri: asset.uri };
}

/**
 * Pick one or more documents (PDF / doc / txt) as note attachments. Returns an
 * empty array if the student cancels.
 */
export async function pickFileAttachments(): Promise<NoteAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    copyToCacheDirectory: true,
    multiple: true,
  });

  if (result.canceled || !result.assets?.length) return [];

  const attachments = result.assets.map((asset) => {
    const size = formatBytes(asset.size ?? undefined);
    const meta = size ? `${extensionLabel(asset.name)} • ${size}` : extensionLabel(asset.name);
    return {
      id: attachmentId(),
      name: asset.name,
      meta,
      uri: asset.uri,
      kind: 'file' as const,
      mimeType: asset.mimeType,
    };
  });
  // Diagnostic: confirms what the picker actually returned (name/mime drive PDF
  // detection). Safe — logs metadata only, never file contents.
  console.log(
    '[files] picked:',
    attachments.map((a) => ({ name: a.name, meta: a.meta, mimeType: a.mimeType, isPdf: isPdf(a) })),
  );
  return attachments;
}

/**
 * Pick one or more images from the library as note attachments. Modern iOS/
 * Android use the system photo picker (no permission prompt needed).
 */
export async function pickImageAttachments(): Promise<NoteAttachment[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.length) return [];

  return result.assets.map((asset, i) => {
    const size = formatBytes(asset.fileSize ?? undefined);
    const name = asset.fileName ?? `Image ${i + 1}`;
    return {
      id: attachmentId(),
      name,
      meta: size ? `Image • ${size}` : 'Image',
      uri: asset.uri,
      kind: 'image' as const,
    };
  });
}

/**
 * Pick a single image as a base64 data URI, for inserting INLINE into the rich
 * editor (a WebView can't load file:// images, but it can render a data URI).
 */
export async function pickInlineImageDataUri(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 0.6,
    base64: true,
  });

  const asset = result.assets?.[0];
  if (result.canceled || !asset?.base64) return null;

  const mime = asset.mimeType ?? 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}
