// The Ask chat store — the conversation, its sending state, and the one action
// that drives a grounded answer end to end (retrieve → stream → cite).
//
// Screens stay thin: the Ask screen renders `messages` and calls `send`; all the
// orchestration (optimistic bubbles, live token append, fallback + friendly
// errors) lives here so the trust logic is in one place.

import { create } from 'zustand';

import { BtlError } from '@/lib/btl';
import { askFromNotes } from '@/lib/chat';
import { useUserStore } from '@/store/use-user-store';
import type { ChatMessage } from '@/types/chat';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Last-resort copy for a non-BtlError throw (shouldn't happen — chat.ts only
// throws BtlError — but never leak a raw stack trace to a stressed student).
const GENERIC_ERROR = 'Something went wrong reaching your study assistant. Please try again.';

type ChatState = {
  messages: ChatMessage[];
  sending: boolean;
  send: (question: string) => Promise<void>;
  reset: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sending: false,

  send: async (raw) => {
    const question = raw.trim();
    if (!question || get().sending) return;

    // Show the question and an empty assistant bubble immediately; the bubble
    // fills in as tokens stream (or flips to the fallback / error).
    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      content: question,
      grounded: false,
      citations: [],
      createdAt: new Date().toISOString(),
    };
    const aiId = createId();
    const aiMsg: ChatMessage = {
      id: aiId,
      role: 'assistant',
      content: '',
      grounded: false,
      citations: [],
      streaming: true,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg, aiMsg], sending: true }));

    const patchAi = (fields: Partial<ChatMessage>) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === aiId ? { ...m, ...fields } : m)),
      }));

    try {
      const result = await askFromNotes(question, {
        onToken: (delta) =>
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === aiId ? { ...m, content: m.content + delta } : m,
            ),
          })),
      });
      patchAi({
        content: result.content,
        grounded: result.grounded,
        citations: result.citations,
        streaming: false,
        error: false,
      });
      // Only a real, note-backed answer counts toward the Dashboard's stat.
      if (result.grounded) void useUserStore.getState().incrementAiAnswers();
    } catch (err) {
      const friendly = err instanceof BtlError ? err.friendly : GENERIC_ERROR;
      patchAi({ content: friendly, grounded: false, citations: [], streaming: false, error: true });
    } finally {
      set({ sending: false });
    }
  },

  reset: () => set({ messages: [], sending: false }),
}));
