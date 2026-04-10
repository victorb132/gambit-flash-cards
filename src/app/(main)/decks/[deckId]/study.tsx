import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, TouchableOpacity, Animated, PanResponder, View } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import {
  X, CheckCircle, XCircle, Question,
  Microphone, MicrophoneSlash, SpeakerHigh, SpeakerSlash, Shuffle,
} from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '../../../../components/ui/Box';
import Text from '../../../../components/ui/Text';
import FlashCardFlip from '../../../../components/flashcard/FlashCardFlip';
import VoiceIndicator from '../../../../components/flashcard/VoiceIndicator';
import { useStudySession } from '../../../../hooks/useStudySession';
import { useTextToSpeech } from '../../../../hooks/useTextToSpeech';
import { useVoiceRecognition, isSpeechRecognitionAvailable } from '../../../../hooks/useVoiceRecognition';
import { useDeckStore } from '../../../../stores/deckStore';
import { getFlashcards as fetchFlashcardsApi } from '../../../../services/api/flashcards';
import { StudyResult } from '../../../../types/study';
import { Theme } from '../../../../theme';
import { formatDuration } from '../../../../utils/formatters';
import StudySkeleton from '../../../../components/common/StudySkeleton';
import { SRS_SWIPE_THRESHOLD } from '../../../../utils/constants';

const voiceAvailable = isSpeechRecognitionAvailable();

export default function StudyScreen() {
  const theme = useTheme<Theme>();
  const { deckId, all } = useLocalSearchParams<{ deckId: string; all?: string }>();
  const studyAll = all === '1';
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId));
  const { setFlashcards } = useDeckStore();

  const {
    cards, currentCard, currentIndex, isFlipped,
    summary, isFinished, isVoiceEnabled, isSpeechEnabled, isShuffled, failedCards, lastAnsweredState,
    startSession, startFailedSession, flip, unflip, answer, undoLastAnswer, resetStudy,
    toggleVoice, toggleSpeech, toggleShuffle,
  } = useStudySession();

  const { speak, stop } = useTextToSpeech();
  const [feedbackColor, setFeedbackColor] = useState<string | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [sessionReady, setSessionReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [showUndo, setShowUndo] = useState(false);
  const undoOpacity = useRef(new Animated.Value(0)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Swipe animation values
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeY = useRef(new Animated.Value(0)).current;

  const cardRotate = swipeX.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  const correctOverlay = swipeX.interpolate({
    inputRange: [0, SRS_SWIPE_THRESHOLD, 160],
    outputRange: [0, 0.15, 0.3],
    extrapolate: 'clamp',
  });
  const wrongOverlay = swipeX.interpolate({
    inputRange: [-160, -SRS_SWIPE_THRESHOLD, 0],
    outputRange: [0.3, 0.15, 0],
    extrapolate: 'clamp',
  });
  const doubtOverlay = swipeY.interpolate({
    inputRange: [-160, -SRS_SWIPE_THRESHOLD, 0],
    outputRange: [0.3, 0.15, 0],
    extrapolate: 'clamp',
  });

  function showUndoButton() {
    setShowUndo(true);
    Animated.timing(undoOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => hideUndoButton(), 3500);
  }

  function hideUndoButton() {
    Animated.timing(undoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setShowUndo(false)
    );
    clearTimeout(undoTimerRef.current);
  }

  function handleUndo() {
    hideUndoButton();
    undoLastAnswer();
  }

  function resetSwipe() {
    Animated.parallel([
      Animated.spring(swipeX, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 4 }),
      Animated.spring(swipeY, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 4 }),
    ]).start();
  }

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => {
      if (!isFlipped) return false;
      return Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8;
    },
    onPanResponderMove: (_, g) => {
      swipeX.setValue(g.dx);
      if (g.dy < 0) swipeY.setValue(g.dy);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx > SRS_SWIPE_THRESHOLD) {
        handleAnswer('correct');
      } else if (g.dx < -SRS_SWIPE_THRESHOLD) {
        handleAnswer('wrong');
      } else if (g.dy < -SRS_SWIPE_THRESHOLD) {
        handleAnswer('doubt');
      } else {
        resetSwipe();
      }
    },
    onPanResponderTerminate: resetSwipe,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isFlipped]);

  useEffect(() => {
    let cancelled = false;
    async function initSession() {
      setSessionReady(false);
      setInitError(null);
      resetStudy();
      try {
        let flashcards = useDeckStore.getState().flashcardsByDeck[deckId] ?? [];
        if (flashcards.length === 0) {
          const response = await fetchFlashcardsApi(deckId);
          flashcards = response.flashcards;
          setFlashcards(deckId, flashcards);
        }
        if (cancelled) return;
        if (flashcards.length === 0) { setInitError('Este deck não tem flashcards.'); return; }
        await startSession(deckId, flashcards, studyAll);
        if (!cancelled) setSessionReady(true);
      } catch {
        if (!cancelled) setInitError('Não foi possível iniciar a sessão. Tente novamente.');
      }
    }
    initSession();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, sessionKey]);

  useEffect(() => {
    if (sessionReady && currentCard && !isFlipped) {
      stop();
      if (isSpeechEnabled) {
        const t = setTimeout(() => speak(currentCard.question), 400);
        return () => clearTimeout(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, sessionReady, isSpeechEnabled]);

  useEffect(() => {
    if (isFlipped && currentCard) {
      stop();
      if (isSpeechEnabled) {
        const t = setTimeout(() => speak(currentCard.answer), 300);
        return () => clearTimeout(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, isSpeechEnabled]);

  // Reset swipe position when card changes
  useEffect(() => {
    swipeX.setValue(0);
    swipeY.setValue(0);
  }, [currentIndex]);

  const handleVoiceCommand = useCallback(
    (command: 'flip' | 'correct' | 'wrong' | 'doubt' | null) => {
      if (!command) return;
      if (command === 'flip' && !isFlipped) flip();
      else if (isFlipped) {
        if (command === 'correct') handleAnswer('correct');
        else if (command === 'wrong') handleAnswer('wrong');
        else if (command === 'doubt') handleAnswer('doubt');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isFlipped, flip]
  );

  const { isListening } = useVoiceRecognition(handleVoiceCommand, isVoiceEnabled && sessionReady);

  function flashFeedback(color: string) {
    setFeedbackColor(color);
    Animated.sequence([
      Animated.timing(feedbackOpacity, { toValue: 0.2, duration: 80, useNativeDriver: true }),
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setFeedbackColor(null));
  }

  async function handleAnswer(result: StudyResult) {
    if (!isFlipped) return;
    const isLastCard = currentIndex + 1 >= cards.length;
    const color = result === 'correct' ? theme.colors.success : result === 'wrong' ? theme.colors.error : theme.colors.warning;
    flashFeedback(color);
    swipeX.setValue(0);
    swipeY.setValue(0);
    stop();
    hideUndoButton();
    await answer(result);
    if (!isLastCard) showUndoButton();
  }

  function handleExit() {
    Alert.alert('Sair do estudo', 'Seu progresso nesta sessão será perdido. Deseja sair?', [
      { text: 'Continuar estudando', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { stop(); resetStudy(); router.back(); } },
    ]);
  }

  function handleStudyAgain() { stop(); hideUndoButton(); setSessionKey((k) => k + 1); }

  async function handleRepeatFailed() {
    stop();
    // Capture failed cards BEFORE resetStudy clears them
    const cardsToRepeat = [...failedCards];
    resetStudy();
    try {
      await startFailedSession(deckId, cardsToRepeat);
      setSessionReady(true);
    } catch {
      setInitError('Não foi possível iniciar a sessão.');
    }
  }

  useFocusEffect(useCallback(() => { return () => { stop(); }; }, [stop]));

  function handleShowQuestion() {
    stop();
    unflip();
    if (currentCard && isSpeechEnabled) setTimeout(() => speak(currentCard.question), 300);
  }

  // ─── Summary screen ────────────────────────────────────────────────────────
  if (isFinished && summary) {
    const pct = summary.totalCards > 0 ? Math.round((summary.correct / summary.totalCards) * 100) : 0;
    const message = pct > 80 ? 'Excelente! Você está dominando!' : pct >= 50 ? 'Bom progresso! Continue praticando!' : 'Não desista! A repetição é a chave!';

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Box flex={1} backgroundColor="surface" padding="l">
          <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 3, textAlign: 'center', marginBottom: 6 }}>
            SESSÃO CONCLUÍDA
          </Text>
          <Text variant="h1" textAlign="center" color="textPrimary" marginBottom="s">{pct}%</Text>
          <Text variant="bodySmall" textAlign="center" color="textSecondary" marginBottom="xl">{message}</Text>

          <Box backgroundColor="white" borderRadius="m" padding="l" marginBottom="l" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
            <Text variant="h3" textAlign="center" color="textPrimary" marginBottom="m">{summary.totalCards} cards</Text>
            <Box flexDirection="row" justifyContent="space-around" marginBottom="m">
              <Box alignItems="center">
                <Text variant="h2" color="success">{summary.correct}</Text>
                <Text variant="caption" color="success">Acertei</Text>
              </Box>
              <Box alignItems="center">
                <Text variant="h2" color="error">{summary.wrong}</Text>
                <Text variant="caption" color="error">Errei</Text>
              </Box>
              <Box alignItems="center">
                <Text variant="h2" color="warning">{summary.doubt}</Text>
                <Text variant="caption" color="warning">Dúvida</Text>
              </Box>
            </Box>
            <Box height={4} borderRadius="round" backgroundColor="border" overflow="hidden" flexDirection="row">
              {summary.correct > 0 && <Box backgroundColor="success" style={{ width: `${(summary.correct / summary.totalCards) * 100}%` }} />}
              {summary.doubt > 0 && <Box backgroundColor="warning" style={{ width: `${(summary.doubt / summary.totalCards) * 100}%` }} />}
              {summary.wrong > 0 && <Box backgroundColor="error" style={{ width: `${(summary.wrong / summary.totalCards) * 100}%` }} />}
            </Box>
            <Box flexDirection="row" justifyContent="space-between" marginTop="m">
              <Text variant="caption" color="textSecondary">{formatDuration(summary.totalTimeMs)} total</Text>
              <Text variant="caption" color="textSecondary">{formatDuration(summary.averageTimePerCardMs)}/card</Text>
            </Box>
          </Box>

          <Box style={{ gap: 10 }}>
            <TouchableOpacity onPress={handleStudyAgain}>
              <Box backgroundColor="primaryDark" borderRadius="s" alignItems="center" style={{ height: 44, justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: theme.colors.surfaceLight, letterSpacing: 0.4 }}>Estudar Novamente</Text>
              </Box>
            </TouchableOpacity>
            {failedCards.length > 0 && (
              <TouchableOpacity onPress={handleRepeatFailed}>
                <Box borderRadius="s" alignItems="center" style={{ height: 44, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.error }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: theme.colors.error, letterSpacing: 0.4 }}>
                    Repetir erros ({failedCards.length})
                  </Text>
                </Box>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.back()}>
              <Box borderRadius="s" alignItems="center" style={{ height: 44, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 0.4 }}>Voltar para o Deck</Text>
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </SafeAreaView>
    );
  }

  if (initError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Box flex={1} alignItems="center" justifyContent="center" padding="xl">
          <Text variant="h3" color="textPrimary" textAlign="center" marginTop="m">{initError}</Text>
          <Box marginTop="l" width={200}>
            <TouchableOpacity onPress={() => setSessionKey((k) => k + 1)}>
              <Box backgroundColor="primaryDark" borderRadius="s" alignItems="center" style={{ height: 44, justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: theme.colors.surfaceLight }}>Tentar Novamente</Text>
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </SafeAreaView>
    );
  }

  if (!sessionReady || !currentCard) return <StudySkeleton />;

  const total = cards.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Box flex={1} backgroundColor="surface">
        {/* Feedback flash overlay */}
        {feedbackColor && (
          <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: feedbackColor, opacity: feedbackOpacity, zIndex: 10 }}
          />
        )}

        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          padding="m"
          style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
        >
          <TouchableOpacity onPress={handleExit}>
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Box alignItems="center">
            <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textPrimary, letterSpacing: -0.2 }}>
              {currentIndex + 1} / {total}
            </Text>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>{deck?.title}</Text>
          </Box>
          <Box flexDirection="row" alignItems="center" style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={() => { toggleShuffle(); setSessionKey((k) => k + 1); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Shuffle size={20} color={isShuffled ? theme.colors.textPrimary : theme.colors.textSecondary} weight={isShuffled ? 'fill' : 'regular'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (isSpeechEnabled) stop(); toggleSpeech(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {isSpeechEnabled
                ? <SpeakerHigh size={20} color={theme.colors.textPrimary} weight="fill" />
                : <SpeakerSlash size={20} color={theme.colors.textSecondary} />}
            </TouchableOpacity>
            {voiceAvailable && (
              <TouchableOpacity onPress={toggleVoice} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {isVoiceEnabled
                  ? <Microphone size={20} color={theme.colors.textPrimary} weight="fill" />
                  : <MicrophoneSlash size={20} color={theme.colors.textSecondary} />}
              </TouchableOpacity>
            )}
          </Box>
        </Box>

        {/* Progress bar */}
        <Box paddingHorizontal="m" paddingTop="s">
          <Box height={2} backgroundColor="border" borderRadius="round" overflow="hidden">
            <Box backgroundColor="primaryDark" borderRadius="round" style={{ width: `${(currentIndex / total) * 100}%`, height: 2 }} />
          </Box>
        </Box>

        <VoiceIndicator isListening={isListening} />

        {!isFlipped && (
          <Box paddingHorizontal="m" marginTop="xs">
            <Text variant="caption" textAlign="center" color="textSecondary">
              Toque para revelar · Após virar, deslize para responder
            </Text>
          </Box>
        )}

        {/* Card area with swipe gesture */}
        <Animated.View
          style={{
            flex: 1,
            padding: 16,
            transform: [
              { rotate: isFlipped ? cardRotate : '0deg' },
              { translateX: isFlipped ? swipeX : new Animated.Value(0) },
            ],
          }}
          {...(isFlipped ? panResponder.panHandlers : {})}
        >
          {/* Color hint overlays during swipe */}
          {isFlipped && (
            <>
              <Animated.View
                pointerEvents="none"
                style={{ position: 'absolute', top: 16, left: 16, right: 16, bottom: 0, backgroundColor: theme.colors.success, opacity: correctOverlay, borderRadius: 16, zIndex: 5 }}
              />
              <Animated.View
                pointerEvents="none"
                style={{ position: 'absolute', top: 16, left: 16, right: 16, bottom: 0, backgroundColor: theme.colors.error, opacity: wrongOverlay, borderRadius: 16, zIndex: 5 }}
              />
              <Animated.View
                pointerEvents="none"
                style={{ position: 'absolute', top: 16, left: 16, right: 16, bottom: 0, backgroundColor: theme.colors.warning, opacity: doubtOverlay, borderRadius: 16, zIndex: 5 }}
              />
            </>
          )}
          <FlashCardFlip
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={isFlipped ? handleShowQuestion : flip}
          />
        </Animated.View>

        {/* Undo floating button */}
        {showUndo && lastAnsweredState && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: isFlipped ? 130 : 40,
              alignSelf: 'center',
              opacity: undoOpacity,
              zIndex: 20,
            }}
            pointerEvents="box-none"
          >
            <TouchableOpacity onPress={handleUndo} activeOpacity={0.8}>
              <View
                style={{
                  backgroundColor: theme.colors.surfaceLight,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  shadowColor: theme.colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 13 }}>↩</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textPrimary, letterSpacing: 0.3 }}>
                  Desfazer
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Swipe hint labels when flipped */}
        {isFlipped && (
          <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="l" marginBottom="s">
            <Text style={{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: theme.colors.error, letterSpacing: 0.5 }}>← ERREI</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: theme.colors.warning, letterSpacing: 0.5 }}>↑ DÚVIDA</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: theme.colors.success, letterSpacing: 0.5 }}>ACERTEI →</Text>
          </Box>
        )}

        {/* Answer buttons */}
        {isFlipped && (
          <View>
            <Box
              flexDirection="row"
              padding="m"
              paddingBottom="l"
              style={{ gap: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }}
            >
              <TouchableOpacity style={{ flex: 1 }} onPress={() => handleAnswer('wrong')}>
                <Box borderRadius="s" alignItems="center" justifyContent="center" style={{ height: 52, borderWidth: 1, borderColor: theme.colors.error, gap: 3 }}>
                  <XCircle size={18} color={theme.colors.error} weight="fill" />
                  <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.error, letterSpacing: 0.5 }}>ERREI</Text>
                </Box>
              </TouchableOpacity>

              <TouchableOpacity style={{ flex: 1 }} onPress={() => handleAnswer('doubt')}>
                <Box borderRadius="s" alignItems="center" justifyContent="center" style={{ height: 52, borderWidth: 1, borderColor: theme.colors.warning, gap: 3 }}>
                  <Question size={18} color={theme.colors.warning} weight="fill" />
                  <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.warning, letterSpacing: 0.5 }}>DÚVIDA</Text>
                </Box>
              </TouchableOpacity>

              <TouchableOpacity style={{ flex: 1 }} onPress={() => handleAnswer('correct')}>
                <Box borderRadius="s" alignItems="center" justifyContent="center" style={{ height: 52, borderWidth: 1, borderColor: theme.colors.success, gap: 3 }}>
                  <CheckCircle size={18} color={theme.colors.success} weight="fill" />
                  <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.success, letterSpacing: 0.5 }}>ACERTEI</Text>
                </Box>
              </TouchableOpacity>
            </Box>
          </View>
        )}
      </Box>
    </SafeAreaView>
  );
}
