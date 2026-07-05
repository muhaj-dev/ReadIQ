// PDF → text through the BTL runtime. An uploaded PDF is sent to a document-
// capable model (see DEFAULT_DOC_MODEL) as an OpenAI-compatible `file` content
// part; the runtime returns the readable text, which becomes the note's body so
// the student reads/annotates it like any other note.
//
// Budget note: this spends BTL credits per upload, so callers should extract
// once and persist the result (the note is saved to SQLite) — never re-extract.

import type { NoteAttachment } from '@/types/note';

import { btlPost, DEFAULT_DOC_MODEL } from './btl';
import { fileUriToDataUri, isPdf } from './files';

// The runtime may return the assistant text a few different ways depending on
// which upstream model served the request: a plain `message.content` string, an
// array of content parts (vision/multimodal models), or the `/responses`-style
// `output_text` / `output[].content[]`. We read all of them so a shape mismatch
// never silently looks like "the PDF had no text".
type ContentPart = { type?: string; text?: string };
type ChatResponse = {
  choices?: { message?: { content?: string | ContentPart[] } }[];
  output_text?: string;
  output?: { content?: ContentPart[] }[];
};

/** Join the `text` fields of an OpenAI-style content-part array. */
function partsToText(parts: ContentPart[]): string {
  return parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('');
}

/** Pull the assistant text out of whatever response shape the gateway returned. */
function readContent(res: ChatResponse): string {
  const message = res.choices?.[0]?.message?.content;
  if (typeof message === 'string') return message.trim();
  if (Array.isArray(message)) return partsToText(message).trim();
  if (typeof res.output_text === 'string') return res.output_text.trim();
  const output = res.output?.[0]?.content;
  if (Array.isArray(output)) return partsToText(output).trim();
  return '';
}

const EXTRACT_PROMPT =
  'Extract ALL of the readable text from this document exactly as written. ' +
  'Preserve headings, lists, and paragraph breaks. Do not summarize, translate, ' +
  'add commentary, or wrap the output in markdown code fences. Return only the text.';

/**
 * Pull the full text out of a single PDF attachment via the BTL runtime.
 * Resolves to the extracted text (may be empty if the model found none). Throws
 * a BtlError on a runtime failure, or a plain Error if the file can't be read —
 * callers map both to a calm message and let the student save without the text.
 */
export async function extractPdfText(attachment: NoteAttachment): Promise<string> {
  // Force application/pdf — a cached file's blob type is unreliable on RN, and a
  // wrong type makes the runtime return no text (the "no content yet" bug).
  const dataUri = await fileUriToDataUri(attachment.uri, 'application/pdf');
  console.log(
    '[pdf-extract] model:',
    DEFAULT_DOC_MODEL,
    '· dataUri prefix:',
    dataUri.slice(0, 40),
    '· base64 length:',
    dataUri.length,
  );

  const res = await btlPost<ChatResponse>('chat/completions', {
    model: DEFAULT_DOC_MODEL,
    temperature: 0,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACT_PROMPT },
          { type: 'file', file: { filename: attachment.name, file_data: dataUri } },
        ],
      },
    ],
  });

  const text = readContent(res);
  console.log('[pdf-extract] response text length:', text.length);
  if (!text) {
    // The call succeeded but yielded no text — usually a request-shape/model
    // mismatch or a gateway refusal, not a genuinely empty PDF. When empty there
    // is no note content to leak, so log the FULL response (truncated) — this is
    // where a "model doesn't support file input" style message shows up.
    console.warn(
      '[pdf-extract] EMPTY result. Raw response (truncated):',
      JSON.stringify(res).slice(0, 800),
    );
  }
  return text;
}

/**
 * Extract text from every PDF in a picked set and join it. Non-PDF attachments
 * are ignored here (they stay as plain attachments). Returns '' when there are
 * no PDFs, so the caller can skip the runtime call entirely.
 */
export async function extractPdfsText(attachments: NoteAttachment[]): Promise<string> {
  const pdfs = attachments.filter(isPdf);
  if (pdfs.length === 0) return '';

  const parts: string[] = [];
  for (const pdf of pdfs) {
    const text = await extractPdfText(pdf);
    if (text) parts.push(text);
  }
  return parts.join('\n\n');
}
