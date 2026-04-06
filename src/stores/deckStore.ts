import { create } from 'zustand';
import { Deck } from '../types/deck';
import { FlashCard } from '../types/flashcard';
import { StudySessionSummary } from '../types/study';

interface DeckState {
  decks: Deck[];
  flashcardsByDeck: Record<string, FlashCard[]>;
  isLoadingDecks: boolean;
  isLoadingFlashcards: boolean;
  setDecks: (decks: Deck[]) => void;
  addDeck: (deck: Deck) => void;
  removeDeck: (deckId: string) => void;
  setFlashcards: (deckId: string, flashcards: FlashCard[]) => void;
  setLoadingDecks: (loading: boolean) => void;
  setLoadingFlashcards: (loading: boolean) => void;
  updateFlashcardStats: (
    deckId: string,
    flashcardId: string,
    result: 'correct' | 'wrong' | 'doubt'
  ) => void;
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

  setFlashcards: (deckId, flashcards) =>
    set((state) => ({
      flashcardsByDeck: { ...state.flashcardsByDeck, [deckId]: flashcards },
    })),

  setLoadingDecks: (isLoadingDecks) => set({ isLoadingDecks }),
  setLoadingFlashcards: (isLoadingFlashcards) => set({ isLoadingFlashcards }),

  updateFlashcardStats: (deckId, flashcardId, result) =>
    set((state) => {
      const cards = state.flashcardsByDeck[deckId];
      if (!cards) return state;
      const updated = cards.map((c) => {
        if (c.id !== flashcardId) return c;
        return {
          ...c,
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

  updateDeckProgress: (deckId, summary) =>
    set((state) => ({
      decks: state.decks.map((d) => {
        if (d.id !== deckId) return d;
        const totalCards = d.cardCount;
        return {
          ...d,
          lastStudiedAt: new Date().toISOString(),
          progress: {
            totalCards,
            mastered: summary.correct,
            learning: summary.wrong + summary.doubt,
            notStarted: Math.max(0, totalCards - summary.totalCards),
            completionPercentage:
              totalCards > 0 ? Math.round((summary.correct / totalCards) * 100) : 0,
          },
        };
      }),
    })),
}));
