import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useStudyStore } from '../stores/studyStore';
import { useDeckStore } from '../stores/deckStore';
import { startStudySession, answerCard, completeSession } from '../services/api/flashcards';
import { StudyResult } from '../types/study';

export function useStudySession() {
  const {
    session,
    cards,
    currentIndex,
    isFlipped,
    summary,
    isVoiceEnabled,
    isSpeechEnabled,
    setSession,
    setCards,
    setFlipped,
    nextCard,
    setSummary,
    resetStudy,
    toggleVoice,
    toggleSpeech,
    getElapsedMs,
  } = useStudyStore();

  const { updateFlashcardStats, updateDeckProgress } = useDeckStore();

  const currentCard = cards[currentIndex] ?? null;
  const isFinished = currentIndex >= cards.length && cards.length > 0;

  async function startSession(deckId: string, flashcards: typeof cards) {
    const response = await startStudySession(deckId);
    setSession(response.session);
    setCards(flashcards);
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

      // Haptic feedback by result
      if (result === 'correct') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result === 'wrong') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Update local store immediately for responsiveness
      updateFlashcardStats(session.deckId, currentCard.id, result);

      try {
        await answerCard(session.id, {
          flashcardId: currentCard.id,
          result,
          timeSpentMs,
        });
      } catch {
        // Best-effort — don't block progression
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        let finalSummary;
        try {
          const response = await completeSession(session.id);
          finalSummary = response.summary;
        } catch {
          // Build summary from what we tracked locally
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
      }

      nextCard();
    },
    [session, currentCard, getElapsedMs, updateFlashcardStats, updateDeckProgress, currentIndex, cards, nextCard, setSummary]
  );

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
    startSession,
    flip,
    unflip,
    answer,
    resetStudy,
    toggleVoice,
    toggleSpeech,
  };
}
