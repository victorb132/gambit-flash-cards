import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, TouchableOpacity, Animated } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { X, CheckCircle, XCircle, Question, Microphone, MicrophoneSlash, SpeakerHigh, SpeakerSlash } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import Box from '../../../../components/ui/Box';
import Text from '../../../../components/ui/Text';
import FlashCardFlip from '../../../../components/flashcard/FlashCardFlip';
import VoiceIndicator from '../../../../components/flashcard/VoiceIndicator';
import { useStudySession } from '../../../../hooks/useStudySession';
import { useTextToSpeech } from '../../../../hooks/useTextToSpeech';
import { useVoiceRecognition } from '../../../../hooks/useVoiceRecognition';
import { useDeckStore } from '../../../../stores/deckStore';
import { getFlashcards as fetchFlashcardsApi } from '../../../../services/api/flashcards';
import { StudyResult } from '../../../../types/study';
import { Theme } from '../../../../theme';
import { formatDuration } from '../../../../utils/formatters';
import StudySkeleton from '../../../../components/common/StudySkeleton';

export default function StudyScreen() {
  const theme = useTheme<Theme>();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId));
  const { setFlashcards } = useDeckStore();

  const {
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
  } = useStudySession();

  const { speak, stop } = useTextToSpeech();
  const [feedbackColor, setFeedbackColor] = useState<string | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  const [sessionReady, setSessionReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

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

        if (flashcards.length === 0) {
          setInitError('Este deck não tem flashcards.');
          return;
        }

        await startSession(deckId, flashcards);

        if (!cancelled) setSessionReady(true);
      } catch (err) {
        if (!cancelled) {
          setInitError('Não foi possível iniciar a sessão. Tente novamente.');
        }
      }
    }

    initSession();

    return () => {
      cancelled = true;
    };
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

  const handleVoiceCommand = useCallback(
    (command: 'flip' | 'correct' | 'wrong' | 'doubt' | null) => {
      if (!command) return;
      if (command === 'flip' && !isFlipped) {
        flip();
      } else if (isFlipped) {
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
      Animated.timing(feedbackOpacity, { toValue: 0.25, duration: 80, useNativeDriver: true }),
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => setFeedbackColor(null));
  }

  async function handleAnswer(result: StudyResult) {
    if (!isFlipped) return;
    const color =
      result === 'correct'
        ? theme.colors.success
        : result === 'wrong'
          ? theme.colors.error
          : theme.colors.warning;
    flashFeedback(color);
    stop();
    await answer(result);
  }

  function handleExit() {
    Alert.alert(
      'Sair do estudo',
      'Seu progresso nesta sessão será perdido. Deseja sair?',
      [
        { text: 'Continuar estudando', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            stop();
            resetStudy();
            router.back();
          },
        },
      ]
    );
  }

  function handleStudyAgain() {
    stop();
    setSessionKey((k) => k + 1);
  }

  useFocusEffect(
    useCallback(() => {
      return () => {
        stop();
      };
    }, [stop])
  );

  function handleShowQuestion() {
    stop();
    unflip();
    if (currentCard && isSpeechEnabled) {
      setTimeout(() => speak(currentCard.question), 300);
    }
  }

  // ─── Summary screen ────────────────────────────────────────────────────────
  if (isFinished && summary) {
    const pct =
      summary.totalCards > 0 ? Math.round((summary.correct / summary.totalCards) * 100) : 0;
    const message =
      pct > 80
        ? 'Excelente! Você está dominando! 🏆'
        : pct >= 50
          ? 'Bom progresso! Continue praticando! 💪'
          : 'Não desista! A repetição é a chave! 🔑';

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Box flex={1} backgroundColor="surface" padding="l">
          <Text variant="h1" textAlign="center" color="textPrimary" marginBottom="s">
            Sessão Concluída!
          </Text>
          <Text variant="body" textAlign="center" color="textSecondary" marginBottom="xl">
            {message}
          </Text>

          <Box backgroundColor="white" borderRadius="xl" padding="l" marginBottom="l" style={{ elevation: 3 }}>
            <Text variant="h2" textAlign="center" color="textPrimary" marginBottom="m">
              {summary.totalCards} cards
            </Text>
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
            <Box
              height={12}
              borderRadius="round"
              backgroundColor="border"
              overflow="hidden"
              flexDirection="row"
            >
              {summary.correct > 0 && (
                <Box
                  backgroundColor="success"
                  style={{ width: `${(summary.correct / summary.totalCards) * 100}%` }}
                />
              )}
              {summary.doubt > 0 && (
                <Box
                  backgroundColor="warning"
                  style={{ width: `${(summary.doubt / summary.totalCards) * 100}%` }}
                />
              )}
              {summary.wrong > 0 && (
                <Box
                  backgroundColor="error"
                  style={{ width: `${(summary.wrong / summary.totalCards) * 100}%` }}
                />
              )}
            </Box>
            <Box flexDirection="row" justifyContent="space-between" marginTop="m">
              <Text variant="caption" color="textSecondary">
                Tempo total: {formatDuration(summary.totalTimeMs)}
              </Text>
              <Text variant="caption" color="textSecondary">
                Média: {formatDuration(summary.averageTimePerCardMs)}/card
              </Text>
            </Box>
          </Box>

          <Box style={{ gap: 12 }}>
            <TouchableOpacity onPress={handleStudyAgain} accessibilityLabel="Estudar novamente">
              <Box backgroundColor="primaryDark" borderRadius="m" padding="m" alignItems="center">
                <Text variant="button" color="white">Estudar Novamente</Text>
              </Box>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar para o deck">
              <Box
                borderRadius="m"
                padding="m"
                alignItems="center"
                borderWidth={2}
                borderColor="border"
              >
                <Text variant="button" color="textSecondary">
                  Voltar para o Deck
                </Text>
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </SafeAreaView>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────────
  if (initError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Box flex={1} alignItems="center" justifyContent="center" padding="xl">
          <Text style={{ fontSize: 48 }}>😕</Text>
          <Text variant="h3" color="textPrimary" textAlign="center" marginTop="m">
            {initError}
          </Text>
          <Box marginTop="l" width={200}>
            <TouchableOpacity
              onPress={() => setSessionKey((k) => k + 1)}
              accessibilityLabel="Tentar novamente"
            >
              <Box backgroundColor="primaryDark" borderRadius="m" padding="m" alignItems="center">
                <Text variant="button" color="white">Tentar Novamente</Text>
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </SafeAreaView>
    );
  }

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (!sessionReady || !currentCard) {
    return <StudySkeleton />;
  }

  const total = cards.length;

  // ─── Main study UI ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Box flex={1} backgroundColor="surface">
        {/* Feedback flash overlay */}
        {feedbackColor && (
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: feedbackColor,
              opacity: feedbackOpacity,
              zIndex: 10,
            }}
            pointerEvents="none"
          />
        )}

        {/* Header */}
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" padding="m">
          <TouchableOpacity onPress={handleExit} accessibilityLabel="Sair do estudo">
            <X size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Box alignItems="center">
            <Text
              variant="bodySmall"
              color="textPrimary"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {currentIndex + 1} / {total}
            </Text>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {deck?.title}
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={() => { if (isSpeechEnabled) stop(); toggleSpeech(); }}
              accessibilityLabel={isSpeechEnabled ? 'Mutar áudio' : 'Ativar áudio'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isSpeechEnabled ? (
                <SpeakerHigh size={22} color={theme.colors.primaryDark} weight="fill" />
              ) : (
                <SpeakerSlash size={22} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleVoice}
              accessibilityLabel={isVoiceEnabled ? 'Desativar microfone' : 'Ativar microfone'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isVoiceEnabled ? (
                <Microphone size={22} color={theme.colors.primaryDark} weight="fill" />
              ) : (
                <MicrophoneSlash size={22} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          </Box>
        </Box>

        {/* Progress bar */}
        <Box paddingHorizontal="m" marginBottom="m">
          <Box height={6} backgroundColor="border" borderRadius="round" overflow="hidden">
            <Box
              backgroundColor="primaryDark"
              borderRadius="round"
              style={{ width: `${(currentIndex / total) * 100}%`, height: 6 }}
            />
          </Box>
        </Box>

        <VoiceIndicator isListening={isListening} />

        {!isFlipped && (
          <Box paddingHorizontal="m" marginBottom="s">
            <Text variant="caption" textAlign="center" color="textSecondary">
              Toque no card ou diga "mostrar resposta" para revelar
            </Text>
          </Box>
        )}

        {/* Card area */}
        <Box flex={1} padding="m">
          <FlashCardFlip
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={isFlipped ? handleShowQuestion : flip}
          />
        </Box>

        {/* Answer buttons — only visible after flip */}
        {isFlipped && (
          <View>
            <Box flexDirection="row" padding="m" paddingBottom="l" style={{ gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleAnswer('wrong')}
                accessibilityLabel="Errei"
              >
                <Box backgroundColor="error" borderRadius="m" padding="m" alignItems="center">
                  <XCircle size={24} color={theme.colors.white} weight="fill" />
                  <Text
                    variant="caption"
                    color="white"
                    marginTop="xs"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Errei
                  </Text>
                </Box>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleAnswer('doubt')}
                accessibilityLabel="Dúvida"
              >
                <Box backgroundColor="warning" borderRadius="m" padding="m" alignItems="center">
                  <Question size={24} color={theme.colors.white} weight="fill" />
                  <Text
                    variant="caption"
                    color="white"
                    marginTop="xs"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Dúvida
                  </Text>
                </Box>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleAnswer('correct')}
                accessibilityLabel="Acertei"
              >
                <Box backgroundColor="success" borderRadius="m" padding="m" alignItems="center">
                  <CheckCircle size={24} color={theme.colors.white} weight="fill" />
                  <Text
                    variant="caption"
                    color="white"
                    marginTop="xs"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Acertei
                  </Text>
                </Box>
              </TouchableOpacity>
            </Box>
          </View>
        )}
      </Box>
    </SafeAreaView>
  );
}
