import { useLocalSearchParams } from 'expo-router';

import { NoteMissing } from '@/components/note/note-missing';
import { NoteReaderView } from '@/components/note/note-reader-view';
import { useNoteDetail } from '@/data/note-detail';

/** Note Reader — the full note on a white page you can read AND annotate: the
 *  pen highlights any selection in any colour, the comment tool pins a margin
 *  note to a passage. Both persist to the note; neither leaves the reader. */
export default function NoteReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useNoteDetail(id ?? '');

  if (!note) return <NoteMissing title="Note Reader" />;

  return <NoteReaderView note={note} />;
}
