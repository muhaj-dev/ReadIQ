import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { ExtractStatus } from '@/components/add/extract-status';
import { NoteForm } from '@/components/note/note-form';
import { emptyNoteDraft } from '@/data/note-detail';
import { useTheme } from '@/hooks/use-theme';
import { BtlError } from '@/lib/btl';
import { isPdf, pickFileAttachments } from '@/lib/files';
import { extractPdfsText } from '@/lib/pdf-extract';
import { plainTextToHtml } from '@/lib/rich-text';
import { summarizeNoteText } from '@/lib/summarize';
import { useNotesStore } from '@/store/use-notes-store';
import type { NoteAttachment } from '@/types/note';

type Status = 'picking' | 'reading' | 'summarizing' | 'error' | 'ready';

/** Add — Upload. Opens the file picker; a picked PDF has its text pulled out
 *  through the BTL runtime and a short AI summary written for it. The Add
 *  Document form still asks for a title, subject, and tags — only the Content
 *  editor is hidden, so the page stays clean while the extracted text is kept on
 *  the note (visible when reading/editing). Non-PDFs just attach. */
export default function UploadScreen() {
  const colors = useTheme();
  const router = useRouter();
  const addNote = useNotesStore((s) => s.addNote);
  const started = useRef(false);

  const [status, setStatus] = useState<Status>('picking');
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [content, setContent] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const back = () => (router.canGoBack() ? router.back() : router.navigate('/add'));

  const extract = async (files: NoteAttachment[]) => {
    setStatus('reading');
    setError(undefined);
    let text = '';
    try {
      text = await extractPdfsText(files);
      console.log('[upload] extracted text length:', text.length);
    } catch (err) {
      console.warn('[upload] extraction threw:', err instanceof BtlError ? `${err.kind}: ${err.message}` : err);
      setError(err instanceof BtlError ? err.friendly : 'We could not read the text from that file.');
      setStatus('error');
      return;
    }
    // The call succeeded but came back with no readable text — don't silently save
    // a blank note. Let the student retry or add the file without extracted text.
    if (files.some(isPdf) && !text.trim()) {
      setError("We couldn't find readable text in that document. Add it as an attachment and type your notes, or try again.");
      setStatus('error');
      return;
    }
    setContent(text);
    // Summary is best-effort — a runtime hiccup just leaves it off; the note still
    // saves with the extracted text. Generated once here so save stays instant.
    if (text.trim()) {
      setStatus('summarizing');
      try {
        setAiSummary((await summarizeNoteText(text)) || null);
      } catch {
        setAiSummary(null);
      }
    }
    setStatus('ready');
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const files = await pickFileAttachments();
      if (!files.length) return back();
      setAttachments(files);
      const hasPdf = files.some(isPdf);
      console.log('[upload] pdf detected?', hasPdf, '→', hasPdf ? 'extracting' : 'skipping extraction');
      if (hasPdf) extract(files);
      else setStatus('ready');
    })();
    // Runs once — the ref guards against a double pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'picking') {
    // The native file picker sits over this surface until the student chooses.
    return <View className="flex-1" style={{ backgroundColor: colors.surface }} />;
  }

  if (status === 'reading' || status === 'summarizing' || status === 'error') {
    return (
      <>
        <StatusBar style="dark" />
        <ExtractStatus
          state={status}
          fileName={attachments[0]?.name ?? 'Document'}
          message={error}
          onRetry={() => extract(attachments)}
          onSkip={() => setStatus('ready')}
        />
      </>
    );
  }

  return (
    <NoteForm
      headerTitle="Add Document"
      attachmentsFirst
      hideContent
      initial={{
        ...emptyNoteDraft,
        title: attachments[0]?.name ?? '',
        content,
        contentHtml: plainTextToHtml(content),
        attachments,
      }}
      onBack={back}
      onSave={async (values) => {
        await addNote({
          title: values.title,
          subject: values.subject,
          content: values.content,
          contentHtml: values.contentHtml,
          tags: values.tags,
          attachments: values.attachments,
          aiSummary,
          source: 'file',
        });
        router.replace('/memory');
      }}
    />
  );
}
