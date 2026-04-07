import { create } from 'zustand';
import { StudySession, StudySessionSummary } from '../types/study';
import { FlashCard } from '../types/flashcard';

interface StudyState {
  session: StudySession | null;
  cards: FlashCard[];
  currentIndex: number;
  isFlipped: boolean;
  summary: StudySessionSummary | null;
  cardStartTime: number;
  isVoiceEnabled: boolean;
  isSpeechEnabled: boolean;
  setSession: (session: StudySession) => void;
  setCards: (cards: FlashCard[]) => void;
  setFlipped: (flipped: boolean) => void;
  nextCard: () => void;
  setSummary: (summary: StudySessionSummary) => void;
  resetStudy: () => void;
  toggleVoice: () => void;
  toggleSpeech: () => void;
  getElapsedMs: () => number;
  resetCardTimer: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  session: null,
  cards: [],
  currentIndex: 0,
  isFlipped: false,
  summary: null,
  cardStartTime: Date.now(),
  isVoiceEnabled: true,
  isSpeechEnabled: true,

  setSession: (session) => set({ session }),
  setCards: (cards) => set({ cards }),
  setFlipped: (isFlipped) => set({ isFlipped }),
  nextCard: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      isFlipped: false,
      cardStartTime: Date.now(),
    })),
  setSummary: (summary) => set({ summary }),
  resetStudy: () =>
    set({
      session: null,
      cards: [],
      currentIndex: 0,
      isFlipped: false,
      summary: null,
      cardStartTime: Date.now(),
    }),
  toggleVoice: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
  toggleSpeech: () => set((state) => ({ isSpeechEnabled: !state.isSpeechEnabled })),
  getElapsedMs: () => Date.now() - get().cardStartTime,
  resetCardTimer: () => set({ cardStartTime: Date.now() }),
}));
