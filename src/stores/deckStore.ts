import { create } from 'zustand';
import { Deck } from '../types/deck';
import { FlashCard } from '../types/flashcard';
import { StudySessionSummary } from '../types/study';
import { SRSData, getDueCount } from '../utils/srs';

interface DeckState {
  decks: Deck[];
  flashcardsByDeck: Record<string, FlashCard[]>;
  isLoadingDecks: boolean;
  isLoadingFlashcards: boolean;
  setDecks: (decks: Deck[]) => void;
  addDeck: (deck: Deck) => void;
  removeDeck: (deckId: string) => void;
  updateDeck: (deckId: string, patch: { title: string; description: string; coverEmoji: string }) => void;
  setFlashcards: (deckId: string, flashcards: FlashCard[]) => void;
  addFlashcard: (deckId: string, card: FlashCard) => void;
  removeFlashcard: (deckId: string, flashcardId: string) => void;
  setLoadingDecks: (loading: boolean) => void;
  setLoadingFlashcards: (loading: boolean) => void;
  updateFlashcard: (deckId: string, flashcardId: string, question: string, answer: string, questionImage?: string, answerImage?: string) => void;
  updateFlashcardStats: (deckId: string, flashcardId: string, result: 'correct' | 'wrong' | 'doubt', nextSRS: SRSData) => void;
  restoreFlashcard: (deckId: string, card: FlashCard) => void;
  resetFlashcardSRS: (deckId: string, flashcardId: string) => void;
  updateDeckProgress: (deckId: string, summary: StudySessionSummary) => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  decks: [],
  flashcardsByDeck: {},
  isLoadingDecks: false,
  isLoadingFlashcards: false,

  setDecks: (decks) => set({ decks }),
  addDeck: (deck) => set((state) => ({ decks: [...state.decks, deck] })),

  removeDeck: (deckId) =>
    set((state) => ({
      decks: state.decks.filter((d) => d.id !== deckId),
      flashcardsByDeck: Object.fromEntries(
        Object.entries(state.flashcardsByDeck).filter(([key]) => key !== deckId)
      ),
    })),

  updateDeck: (deckId, patch) =>
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
      ),
    })),

  setFlashcards: (deckId, flashcards) =>
    set((state) => ({
      flashcardsByDeck: { ...state.flashcardsByDeck, [deckId]: flashcards },
      decks: state.decks.map((d) => {
        if (d.id !== deckId) return d;
        const dueCount = getDueCount(flashcards);
        return { ...d, progress: { ...d.progress, dueCount } };
      }),
    })),

  addFlashcard: (deckId, card) =>
    set((state) => {
      const existing = state.flashcardsByDeck[deckId] ?? [];
      const updated = [...existing, card];
      const decks = state.decks.map((d) => {
        if (d.id !== deckId) return d;
        const newCount = d.cardCount + 1;
        return {
          ...d,
          cardCount: newCount,
          progress: d.progress
            ? {
                ...d.progress,
                totalCards: newCount,
                notStarted: d.progress.notStarted + 1,
                dueCount: getDueCount(updated),
              }
            : d.progress,
        };
      });
      return { decks, flashcardsByDeck: { ...state.flashcardsByDeck, [deckId]: updated } };
    }),

  removeFlashcard: (deckId, flashcardId) =>
    set((state) => {
      const existing = state.flashcardsByDeck[deckId] ?? [];
      const updated = existing.filter((c) => c.id !== flashcardId);
      const decks = state.decks.map((d) => {
        if (d.id !== deckId) return d;
        const newCount = Math.max(0, d.cardCount - 1);
        return {
          ...d,
          cardCount: newCount,
          progress: d.progress
            ? {
                ...d.progress,
                totalCards: newCount,
                dueCount: getDueCount(updated),
              }
            : d.progress,
        };
      });
      return { decks, flashcardsByDeck: { ...state.flashcardsByDeck, [deckId]: updated } };
    }),

  setLoadingDecks: (isLoadingDecks) => set({ isLoadingDecks }),
  setLoadingFlashcards: (isLoadingFlashcards) => set({ isLoadingFlashcards }),

  updateFlashcard: (deckId, flashcardId, question, answer, questionImage, answerImage) =>
    set((state) => {
      const cards = state.flashcardsByDeck[deckId];
      if (!cards) return state;
      const updated = cards.map((c) =>
        c.id === flashcardId ? { ...c, question, answer, questionImage, answerImage } : c
      );
      return { flashcardsByDeck: { ...state.flashcardsByDeck, [deckId]: updated } };
    }),

  updateFlashcardStats: (deckId, flashcardId, result, nextSRS) =>
    set((state) => {
      const cards = state.flashcardsByDeck[deckId];
      if (!cards) return state;
      const updated = cards.map((c) => {
        if (c.id !== flashcardId) return c;
        return {
          ...c,
          srs: nextSRS,
          stats: {
            ...c.stats,
            timesStudied: c.stats.timesStudied + 1,
            timesCorrect: result === 'correct' ? c.stats.timesCorrect + 1 : c.stats.timesCorrect,
            timesWrong: result === 'wrong' ? c.stats.timesWrong + 1 : c.stats.timesWrong,
            timesDoubt: result === 'doubt' ? c.stats.timesDoubt + 1 : c.stats.timesDoubt,
            lastResult: result,
            lastStudiedAt: new Date().toISOString(),
          },
        };
      });
      return { flashcardsByDeck: { ...state.flashcardsByDeck, [deckId]: updated } };
    }),

  restoreFlashcard: (deckId, card) =>
    set((state) => {
      const cards = state.flashcardsByDeck[deckId];
      if (!cards) return state;
      return {
        flashcardsByDeck: {
          ...state.flashcardsByDeck,
          [deckId]: cards.map((c) => (c.id === card.id ? card : c)),
        },
      };
    }),

  resetFlashcardSRS: (deckId, flashcardId) =>
    set((state) => {
      const cards = state.flashcardsByDeck[deckId];
      if (!cards) return state;
      const due = new Date();
      due.setHours(0, 0, 0, 0);
      const initialSRS = { interval: 0, easeFactor: 2.5, repetitions: 0, dueDate: due.toISOString() };
      return {
        flashcardsByDeck: {
          ...state.flashcardsByDeck,
          [deckId]: cards.map((c) =>
            c.id === flashcardId
              ? { ...c, srs: initialSRS, stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 } }
              : c
          ),
        },
      };
    }),

  updateDeckProgress: (deckId, _summary) =>
    set((state) => {
      const cards = state.flashcardsByDeck[deckId] ?? [];
      return {
        decks: state.decks.map((d) => {
          if (d.id !== deckId) return d;
          const totalCards = d.cardCount;
          // Derive true mastery from SRS data, not session counts
          const notStarted = cards.filter((c) => c.stats.timesStudied === 0).length;
          const mastered = cards.filter((c) => (c.srs?.interval ?? 0) >= 7).length;
          const learning = Math.max(0, totalCards - notStarted - mastered);
          return {
            ...d,
            lastStudiedAt: new Date().toISOString(),
            progress: {
              totalCards,
              mastered,
              learning,
              notStarted,
              completionPercentage: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
              dueCount: getDueCount(cards),
            },
          };
        }),
      };
    }),
}));
