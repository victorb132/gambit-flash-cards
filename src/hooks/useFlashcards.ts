import { useCallback, useState } from 'react';
import { useDeckStore } from '../stores/deckStore';
import { getFlashcards } from '../services/api/flashcards';

export function useFlashcards(deckId: string) {
  const { flashcardsByDeck, isLoadingFlashcards, setFlashcards, setLoadingFlashcards } =
    useDeckStore();
  const [error, setError] = useState<string | null>(null);

  const cards = flashcardsByDeck[deckId] ?? [];

  const fetchFlashcards = useCallback(async () => {
    setLoadingFlashcards(true);
    setError(null);
    try {
      const response = await getFlashcards(deckId);
      setFlashcards(deckId, response.flashcards);
    } catch {
      setError('Não foi possível carregar os flashcards.');
    } finally {
      setLoadingFlashcards(false);
    }
  }, [deckId, setFlashcards, setLoadingFlashcards]);

  return { cards, isLoadingFlashcards, error, fetchFlashcards };
}
