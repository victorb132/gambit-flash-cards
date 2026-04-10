import { create } from 'zustand';
import { StudySession, StudySessionSummary, StudyResult } from '@/types/study';
import { FlashCard } from '@/types/flashcard';

interface LastAnsweredState {
  card: FlashCard;
  result: StudyResult;
}

interface StudyState {
  session: StudySession | null;
  cards: FlashCard[];
  currentIndex: number;
  isFlipped: boolean;
  summary: StudySessionSummary | null;
  cardStartTime: number;
  isVoiceEnabled: boolean;
  isSpeechEnabled: boolean;
  isShuffled: boolean;
  failedCards: FlashCard[];
  lastAnsweredState: LastAnsweredState | null;
  setSession: (session: StudySession) => void;
  setCards: (cards: FlashCard[]) => void;
  setFlipped: (flipped: boolean) => void;
  nextCard: () => void;
  prevCard: () => void;
  setSummary: (summary: StudySessionSummary) => void;
  resetStudy: () => void;
  toggleVoice: () => void;
  toggleSpeech: () => void;
  toggleShuffle: () => void;
  addFailedCard: (card: FlashCard) => void;
  removeFailedCard: (cardId: string) => void;
  clearFailedCards: () => void;
  setLastAnsweredState: (state: LastAnsweredState | null) => void;
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
  isShuffled: false,
  failedCards: [],
  lastAnsweredState: null,

  setSession: (session) => set({ session }),
  setCards: (cards) => set({ cards }),
  setFlipped: (isFlipped) => set({ isFlipped }),
  nextCard: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      isFlipped: false,
      cardStartTime: Date.now(),
    })),
  prevCard: () =>
    set((state) => ({
      currentIndex: Math.max(0, state.currentIndex - 1),
      isFlipped: false,
      cardStartTime: Date.now(),
      lastAnsweredState: null,
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
      failedCards: [],
      lastAnsweredState: null,
    }),
  toggleVoice: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
  toggleSpeech: () => set((state) => ({ isSpeechEnabled: !state.isSpeechEnabled })),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  addFailedCard: (card) =>
    set((state) => {
      if (state.failedCards.some((c) => c.id === card.id)) return state;
      return { failedCards: [...state.failedCards, card] };
    }),
  removeFailedCard: (cardId) =>
    set((state) => ({ failedCards: state.failedCards.filter((c) => c.id !== cardId) })),
  clearFailedCards: () => set({ failedCards: [] }),
  setLastAnsweredState: (lastAnsweredState) => set({ lastAnsweredState }),
  getElapsedMs: () => Date.now() - get().cardStartTime,
  resetCardTimer: () => set({ cardStartTime: Date.now() }),
}));
