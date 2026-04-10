import { useCallback, useState } from 'react';
import { useDeckStore } from '@/stores/deckStore';
import { getDecks, deleteDeck } from '@/services/api/decks';
import { Deck } from '@/types/deck';

export function useDecks() {
  const { decks, isLoadingDecks, setDecks, removeDeck, setLoadingDecks } = useDeckStore();
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    setLoadingDecks(true);
    setError(null);
    try {
      const response = await getDecks();
      setDecks(response.decks);
    } catch (err) {
      setError('Não foi possível carregar os decks.');
    } finally {
      setLoadingDecks(false);
    }
  }, [setDecks, setLoadingDecks]);

  const removeDecks = useCallback(
    async (deckId: string) => {
      try {
        await deleteDeck(deckId);
        removeDeck(deckId);
        return true;
      } catch {
        setError('Não foi possível deletar o deck.');
        return false;
      }
    },
    [removeDeck]
  );

  const filterDecks = useCallback(
    (query: string): Deck[] => {
      if (!query.trim()) return decks;
      const lower = query.toLowerCase();
      return decks.filter(
        (d) =>
          d.title.toLowerCase().includes(lower) || d.description.toLowerCase().includes(lower)
      );
    },
    [decks]
  );

  return { decks, isLoadingDecks, error, fetchDecks, removeDecks, filterDecks };
}
