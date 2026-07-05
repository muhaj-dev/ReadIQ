// Record transcription — lecture audio → transcript via OpenAI Whisper.
//
// ⚠️ This is the ONE feature that does NOT route through the BTL runtime: BTL has
// no working audio-transcription path (verified — /audio/transcriptions is 404,
// gpt-audio 400s, voxtral's context caps at ~1s of audio). Whisper's multipart
// endpoint uploads the recording over plain fetch, so it runs in Expo Go with no
// dev build. The returned transcript is then summarized by btl-2, so the AI
// summary stays on BTL.
//
// The transcript never blocks a save: if the key is missing we land straight on
// the manual editor, and any call failure surfaces the retry/"type it instead"
// screen (see use-media-extraction + record-result).

// OpenAI credentials for transcription only — kept isolated to this file, the way
// the BTL key is isolated to lib/btl.ts. Add EXPO_PUBLIC_OPENAI_API_KEY to .env.
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const OPENAI_BASE_URL = (process.env.EXPO_PUBLIC_OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
// Defaults to OpenAI's whisper-1, but any Whisper-compatible endpoint works via the
// base-URL + model overrides (e.g. Groq's free whisper-large-v3).
const WHISPER_MODEL = process.env.EXPO_PUBLIC_OPENAI_STT_MODEL ?? 'whisper-1';

/** True only when an OpenAI key is present — otherwise Record uses a manual transcript. */
export function isTranscriptionConfigured(): boolean {
  return OPENAI_API_KEY.length > 0;
}

/** Multipart filename + mime from the recording's extension (Whisper reads the bytes). */
function audioFile(uri: string): { name: string; type: string } {
  const u = uri.toLowerCase();
  if (u.endsWith('.wav')) return { name: 'audio.wav', type: 'audio/wav' };
  if (u.endsWith('.mp3')) return { name: 'audio.mp3', type: 'audio/mpeg' };
  if (u.endsWith('.caf')) return { name: 'audio.caf', type: 'audio/x-caf' };
  return { name: 'audio.m4a', type: 'audio/m4a' }; // expo-audio HIGH_QUALITY → AAC/.m4a
}

/** Transcribe a recorded lecture via OpenAI Whisper. '' when not configured; throws on failure. */
export async function transcribeAudio(uri: string): Promise<string> {
  if (!isTranscriptionConfigured()) {
    // No key → skip straight to the editable transcript instead of an error screen.
    console.warn('[transcription] EXPO_PUBLIC_OPENAI_API_KEY not set — using manual transcript.');
    return '';
  }

  const file = audioFile(uri);
  const form = new FormData();
  // React Native multipart file part: { uri, name, type } — fetch streams file:// directly.
  form.append('file', { uri, name: file.name, type: file.type } as unknown as Blob);
  form.append('model', WHISPER_MODEL);
  form.append('response_format', 'text'); // body IS the transcript — no JSON to parse

  let res: Response;
  try {
    // Global RN fetch (not expo/fetch) — it handles multipart file uploads. No
    // Content-Type header: fetch sets the multipart boundary itself.
    res = await fetch(`${OPENAI_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });
  } catch (err) {
    console.warn('[transcription] network error:', String(err));
    throw new Error('Could not reach the transcription service.');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn('[transcription] HTTP', res.status, detail.slice(0, 300));
    throw new Error(`Transcription failed (${res.status}).`);
  }

  return (await res.text()).trim();
}
