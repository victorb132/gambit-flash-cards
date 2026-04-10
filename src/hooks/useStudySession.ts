import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useStudyStore } from '@/stores/studyStore';
import { useDeckStore } from '@/stores/deckStore';
import { useStatsStore } from '@/stores/statsStore';
import { startStudySession, answerCard, completeSession } from '@/services/api/flashcards';
import { StudyResult } from '@/types/study';
import { isDue, getInitialSRS } from '@/utils/srs';

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function useStudySession() {
  const {
    session,
    cards,
    currentIndex,
    isFlipped,
    summary,
    isVoiceEnabled,
    isSpeechEnabled,
    isShuffled,
    failedCards,
    lastAnsweredState,
    setSession,
    setCards,
    setFlipped,
    nextCard,
    prevCard,
    setSummary,
    resetStudy,
    toggleVoice,
    toggleSpeech,
    toggleShuffle,
    addFailedCard,
    removeFailedCard,
    clearFailedCards,
    setLastAnsweredState,
    getElapsedMs,
  } = useStudyStore();

  const { updateFlashcardStats, updateDeckProgress, restoreFlashcard } = useDeckStore();
  const { recordSession } = useStatsStore();

  const currentCard = cards[currentIndex] ?? null;
  const isFinished = currentIndex >= cards.length && cards.length > 0;

  async function startSession(deckId: string, allFlashcards: typeof cards, studyAll = false) {
    const response = await startStudySession(deckId);
    setSession(response.session);
    clearFailedCards();

    // Filter to due cards only; fallback to all if none due
    let pool = studyAll ? allFlashcards : allFlashcards.filter((c) => isDue(c.srs));
    if (pool.length === 0) pool = allFlashcards;
    if (isShuffled) pool = shuffleArray(pool);
    setCards(pool);
  }

  async function startFailedSession(deckId: string, cardsToRepeat: typeof cards) {
    const response = await startStudySession(deckId);
    setSession(response.session);
    clearFailedCards();
    const pool = isShuffled ? shuffleArray(cardsToRepeat) : [...cardsToRepeat];
    setCards(pool);
  }

  const flip = useCallback(() => {
    if (!isFlipped) {
      setFlipped(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isFlipped, setFlipped]);

  const unflip = useCallback(() => {
    setFlipped(false);
  }, [setFlipped]);

  const answer = useCallback(
    async (result: StudyResult) => {
      if (!session || !currentCard) return;

      const timeSpentMs = getElapsedMs();

      if (result === 'correct') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result === 'wrong') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      let nextSRS = getInitialSRS();
      try {
        const res = await answerCard(session.id, {
          flashcardId: currentCard.id,
          result,
          timeSpentMs,
        });
        nextSRS = res.nextSRS;
      } catch {
        // best-effort
      }

      // Save pre-update snapshot for undo (deep-copy stats and srs)
      setLastAnsweredState({
        card: {
          ...currentCard,
          stats: { ...currentCard.stats },
          srs: currentCard.srs ? { ...currentCard.srs } : undefined,
        },
        result,
      });

      updateFlashcardStats(session.deckId, currentCard.id, result, nextSRS);

      if (result === 'wrong' || result === 'doubt') {
        addFailedCard(currentCard);
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        let finalSummary;
        try {
          const response = await completeSession(session.id);
          finalSummary = response.summary;
        } catch {
          const correct = cards.filter((c) => c.stats.lastResult === 'correct').length;
          const wrong = cards.filter((c) => c.stats.lastResult === 'wrong').length;
          const doubt = cards.filter((c) => c.stats.lastResult === 'doubt').length;
          finalSummary = {
            totalCards: cards.length,
            correct,
            wrong,
            doubt,
            totalTimeMs: 0,
            averageTimePerCardMs: 0,
          };
        }
        setSummary(finalSummary);
        updateDeckProgress(session.deckId, finalSummary);
        // Record for streak & global stats
        recordSession(finalSummary);
      }

      nextCard();
    },
    [session, currentCard, getElapsedMs, updateFlashcardStats, updateDeckProgress, recordSession, currentIndex, cards, nextCard, setSummary, addFailedCard, setLastAnsweredState]
  );

  function undoLastAnswer() {
    if (!lastAnsweredState || !session || currentIndex === 0) return;
    const { card: savedCard, result } = lastAnsweredState;
    // Restore the card's pre-answer state in deckStore (in-memory only)
    restoreFlashcard(session.deckId, savedCard);
    // Remove from failedCards if it was added
    if (result === 'wrong' || result === 'doubt') {
      removeFailedCard(savedCard.id);
    }
    // Go back to previous card (clears lastAnsweredState via prevCard)
    prevCard();
  }

  return {
    session,
    cards,
    currentCard,
    currentIndex,
    isFlipped,
    summary,
    isFinished,
    isVoiceEnabled,
    isSpeechEnabled,
    isShuffled,
    failedCards,
    lastAnsweredState,
    startSession,
    startFailedSession,
    flip,
    unflip,
    answer,
    undoLastAnswer,
    resetStudy,
    toggleVoice,
    toggleSpeech,
    toggleShuffle,
  };
}
