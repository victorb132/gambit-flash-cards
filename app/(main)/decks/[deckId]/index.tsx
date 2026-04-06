import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { ArrowLeft, CheckCircle, XCircle, Question, Minus } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useDeckStore } from '@/stores/deckStore';
import { FlashCard } from '@/types/flashcard';
import { Theme } from '@/theme';
import { truncate } from '@/utils/formatters';

export default function DeckDetailScreen() {
  const theme = useTheme<Theme>();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { cards, isLoadingFlashcards, fetchFlashcards } = useFlashcards(deckId);
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId));
  const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  function getResultIcon(card: FlashCard) {
    const result = card.stats.lastResult;
    if (!result) return <Minus size={18} color={theme.colors.textSecondary} />;
    if (result === 'correct') return <CheckCircle size={18} color={theme.colors.success} weight="fill" />;
    if (result === 'wrong') return <XCircle size={18} color={theme.colors.error} weight="fill" />;
    return <Question size={18} color={theme.colors.warning} weight="fill" />;
  }

  if (isLoadingFlashcards) {
    return <LoadingState message="Carregando flashcards..." />;
  }

  const progress = deck?.progress;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Box flex={1} backgroundColor="surface">
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          padding="m"
          borderBottomWidth={1}
          borderColor="border"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Box marginLeft="m" flex={1}>
            <Text variant="h3" numberOfLines={1}>
              {deck?.coverEmoji} {deck?.title ?? 'Deck'}
            </Text>
          </Box>
        </Box>

        {/* Progress summary */}
        {progress && (
          <Box
            backgroundColor="white"
            margin="m"
            borderRadius="l"
            padding="m"
            style={{
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Box flexDirection="row" justifyContent="space-between" marginBottom="m">
              <Text variant="bodySmall" color="textSecondary">
                {progress.totalCards} cards no total
              </Text>
              <Text variant="bodySmall" color="success" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {progress.completionPercentage}% dominado
              </Text>
            </Box>
            <ProgressBar
              segments={[
                { value: progress.mastered, color: 'success' },
                { value: progress.learning, color: 'warning' },
                { value: progress.notStarted, color: 'border' },
              ]}
              height={10}
            />
            <Box flexDirection="row" marginTop="m" justifyContent="space-around">
              <Box alignItems="center">
                <Text variant="h3" color="success">{progress.mastered}</Text>
                <Text variant="caption" color="textSecondary">Acertei</Text>
              </Box>
              <Box alignItems="center">
                <Text variant="h3" color="warning">{progress.learning}</Text>
                <Text variant="caption" color="textSecondary">Aprendendo</Text>
              </Box>
              <Box alignItems="center">
                <Text variant="h3" color="textSecondary">{progress.notStarted}</Text>
                <Text variant="caption" color="textSecondary">Novo</Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Flashcard list */}
        {cards.length === 0 ? (
          <EmptyState
            emoji="📋"
            title="Sem flashcards"
            description="Este deck não tem cards ainda."
          />
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.m,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCard(item)}
                accessibilityLabel={`Card ${item.order}: ${item.question}`}
              >
                <Box
                  backgroundColor="white"
                  borderRadius="m"
                  padding="m"
                  marginBottom="s"
                  flexDirection="row"
                  alignItems="center"
                  borderWidth={1}
                  borderColor="border"
                >
                  <Text
                    variant="caption"
                    color="textSecondary"
                    style={{ fontFamily: 'Poppins_600SemiBold', width: 32 }}
                  >
                    #{item.order}
                  </Text>
                  <Text variant="bodySmall" flex={1} numberOfLines={2}>
                    {truncate(item.question, 80)}
                  </Text>
                  <Box marginLeft="s">{getResultIcon(item)}</Box>
                </Box>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Study button */}
        {cards.length > 0 && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            padding="m"
            backgroundColor="surface"
            borderTopWidth={1}
            borderColor="border"
          >
            <Button
              label="Estudar Deck"
              onPress={() => router.push(`/(main)/decks/${deckId}/study`)}
              fullWidth
            />
          </Box>
        )}

        {/* Card detail modal */}
        <Modal
          visible={!!selectedCard}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedCard(null)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setSelectedCard(null)}
          >
            <TouchableOpacity activeOpacity={1}>
              <Box
                backgroundColor="white"
                borderTopLeftRadius="xl"
                borderTopRightRadius="xl"
                padding="l"
                style={{ maxHeight: '80%' }}
              >
                <Box
                  width={40}
                  height={4}
                  borderRadius="round"
                  backgroundColor="border"
                  alignSelf="center"
                  marginBottom="l"
                />
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text
                    variant="caption"
                    color="primaryDark"
                    style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                  >
                    Pergunta
                  </Text>
                  <Text variant="body" marginTop="s" marginBottom="l">
                    {selectedCard?.question}
                  </Text>
                  <Box height={1} backgroundColor="border" marginBottom="l" />
                  <Text
                    variant="caption"
                    color="success"
                    style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                  >
                    Resposta
                  </Text>
                  <Text variant="body" marginTop="s" marginBottom="xl">
                    {selectedCard?.answer}
                  </Text>
                </ScrollView>
              </Box>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </Box>
    </SafeAreaView>
  );
}
