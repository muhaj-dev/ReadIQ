import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useEffect, useState } from 'react';

export type RecorderStatus = 'starting' | 'denied' | 'recording' | 'paused' | 'stopped';

/**
 * Drives the Record Lecture screen: asks for the mic, starts recording
 * immediately, and keeps a simple elapsed-seconds timer. The captured audio is
 * transcribed through the BTL runtime in Phase 8 — for now it is discarded.
 */
export function useLectureRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<RecorderStatus>('starting');
  const [seconds, setSeconds] = useState(0);

  // The student already chose "Record Lecture", so recording starts on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setStatus('denied');
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
        setStatus('recording');
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
    // The recorder instance is stable across renders (expo-audio owns it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => setSeconds((now) => now + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  /** Pause ↔ resume. */
  const toggle = () => {
    if (status === 'recording') {
      recorder.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      recorder.record();
      setStatus('recording');
    }
  };

  /** Stop the recorder (both "discard" and "save" end here for now). */
  const stop = async () => {
    if (status !== 'recording' && status !== 'paused') return;
    setStatus('stopped');
    try {
      await recorder.stop();
    } catch {
      // Already stopped or never started — nothing to clean up.
    }
  };

  return { status, seconds, toggle, stop };
}
