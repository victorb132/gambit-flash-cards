import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, Modal, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { ArrowLeft, CheckCircle, XCircle, Question, Minus, PencilSimple, X } from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Box from '../../../../components/ui/Box';
import Text from '../../../../components/ui/Text';
import Button from '../../../../components/ui/Button';
import ProgressBar from '../../../../components/ui/ProgressBar';
import EmptyState from '../../../../components/common/EmptyState';
import FlashcardListSkeleton from '../../../../components/common/FlashcardListSkeleton';
import { useFlashcards } from '../../../../hooks/useFlashcards';
import { useDeckStore } from '../../../../stores/deckStore';
import { updateFlashcard } from '../../../../services/api/flashcards';
import { DeckIconBox } from '../../../../utils/deckIcon';
import { FlashCard } from '../../../../types/flashcard';
import { Theme } from '../../../../theme';
import { truncate } from '../../../../utils/formatters';

export default function DeckDetailScreen() {
  const theme = useTheme<Theme>();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { cards, isLoadingFlashcards, fetchFlashcards } = useFlashcards(deckId);
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId));
  const { updateFlashcard: updateCardInStore } = useDeckStore();
  const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!selectedCard) setIsEditing(false);
  }, [selectedCard]);

  function handleStartEdit() {
    if (!selectedCard) return;
    setEditQuestion(selectedCard.question);
    setEditAnswer(selectedCard.answer);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!selectedCard) return;
    setIsSaving(true);
    try {
      await updateFlashcard(deckId, selectedCard.id, editQuestion.trim(), editAnswer.trim());
      updateCardInStore(deckId, selectedCard.id, editQuestion.trim(), editAnswer.trim());
      setSelectedCard((c) => c ? { ...c, question: editQuestion.trim(), answer: editAnswer.trim() } : c);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

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
    return <FlashcardListSkeleton />;
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
          style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          {deck && (
            <Box marginLeft="s">
              <DeckIconBox
                emoji={deck.coverEmoji}
                deckId={deck.id}
                size={20}
                boxSize={40}
                borderRadius={8}
                colors={theme.colors}
              />
            </Box>
          )}
          <Box marginLeft="m" flex={1}>
            <Text variant="h3" color="textPrimary" numberOfLines={1}>
              {deck?.title ?? 'Deck'}
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
            style={{ elevation: 3 }}
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
                <Text variant="h3" color="textPrimary">{progress.notStarted}</Text>
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
                style={{ marginBottom: 8 }}
              >
                <Box
                  backgroundColor="white"
                  borderRadius="m"
                  padding="m"
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
                  <Text variant="bodySmall" color="textPrimary" flex={1} numberOfLines={2}>
                    {truncate(item.question, 80)}
                  </Text>
                  <Box marginLeft="s">{getResultIcon(item)}</Box>
                </Box>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Study button bottom bar */}
        {cards.length > 0 && (
          <Box
            backgroundColor="surface"
            padding="m"
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingBottom: insets.bottom + 16,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            }}
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
            <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
              <View
                style={{
                  backgroundColor: 'white',
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingHorizontal: 24,
                  paddingTop: 20,
                  maxHeight: height * 0.75,
                  paddingBottom: insets.bottom + 16,
                }}
              >
                {/* Sheet handle */}
                <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="l">
                  {isEditing ? (
                    <TouchableOpacity onPress={() => setIsEditing(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  ) : (
                    <Box width={20} />
                  )}
                  <Box width={40} height={4} borderRadius="round" backgroundColor="border" />
                  {isEditing ? (
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text variant="caption" color="primary" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        {isSaving ? 'Salvando...' : 'Salvar'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleStartEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <PencilSimple size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </Box>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text
                    variant="caption"
                    color="textSecondary"
                    style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                    marginBottom="s"
                  >
                    Pergunta
                  </Text>
                  {isEditing ? (
                    <TextInput
                      value={editQuestion}
                      onChangeText={setEditQuestion}
                      multiline
                      style={{
                        fontFamily: 'Poppins_400Regular',
                        fontSize: 16,
                        color: theme.colors.textPrimary,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: 8,
                        padding: 12,
                        minHeight: 80,
                        textAlignVertical: 'top',
                        marginBottom: 16,
                        backgroundColor: theme.colors.white,
                      }}
                    />
                  ) : (
                    <Text variant="body" marginBottom="l">
                      {selectedCard?.question}
                    </Text>
                  )}

                  <Box height={1} backgroundColor="border" marginBottom="l" />

                  <Text
                    variant="caption"
                    color="success"
                    style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                    marginBottom="s"
                  >
                    Resposta
                  </Text>
                  {isEditing ? (
                    <TextInput
                      value={editAnswer}
                      onChangeText={setEditAnswer}
                      multiline
                      style={{
                        fontFamily: 'Poppins_400Regular',
                        fontSize: 16,
                        color: theme.colors.textPrimary,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: 8,
                        padding: 12,
                        minHeight: 100,
                        textAlignVertical: 'top',
                        marginBottom: 16,
                        backgroundColor: theme.colors.white,
                      }}
                    />
                  ) : (
                    <Text variant="body" marginBottom="m">
                      {selectedCard?.answer}
                    </Text>
                  )}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </Box>
    </SafeAreaView>
  );
}
