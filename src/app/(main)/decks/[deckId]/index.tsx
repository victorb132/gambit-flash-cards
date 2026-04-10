import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList, TouchableOpacity, Modal, ScrollView, TextInput,
  useWindowDimensions, View, Image, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import {
  ArrowLeft, CheckCircle, XCircle, Question, Minus,
  PencilSimple, X, Plus, Trash, DotsThreeVertical, MagnifyingGlass,
} from 'phosphor-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Box from '../../../../components/ui/Box';
import Text from '../../../../components/ui/Text';
import Button from '../../../../components/ui/Button';
import ProgressBar from '../../../../components/ui/ProgressBar';
import EmptyState from '../../../../components/common/EmptyState';
import FlashcardListSkeleton from '../../../../components/common/FlashcardListSkeleton';
import ImagePickerField from '../../../../components/ui/ImagePickerField';
import { useFlashcards } from '../../../../hooks/useFlashcards';
import { useDeckStore } from '../../../../stores/deckStore';
import { updateFlashcard, deleteFlashcard as deleteFlashcardApi, resetFlashcardSRS as resetFlashcardSRSApi } from '../../../../services/api/flashcards';
import { updateDeck as updateDeckApi, deleteDeck as deleteDeckApi } from '../../../../services/api/decks';
import { DeckIconBox } from '../../../../utils/deckIcon';
import { FlashCard } from '../../../../types/flashcard';
import { Theme } from '../../../../theme';
import { truncate } from '../../../../utils/formatters';

const EMOJI_OPTIONS = ['📚', '📖', '💡', '🧠', '💻', '🧬', '🔬', '🌍', '🎨', '🏆', '🎵', '🧩', '🗣️', '❤️', '📊'];

export default function DeckDetailScreen() {
  const theme = useTheme<Theme>();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { cards, isLoadingFlashcards, fetchFlashcards } = useFlashcards(deckId);
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId));
  const { updateFlashcard: updateCardInStore, removeFlashcard, updateDeck: updateDeckInStore, removeDeck, resetFlashcardSRS: resetSRSInStore } = useDeckStore();

  // Card modal state
  const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editQuestionImage, setEditQuestionImage] = useState<string | undefined>();
  const [editAnswerImage, setEditAnswerImage] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit deck modal state
  const [showEditDeck, setShowEditDeck] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEmoji, setEditEmoji] = useState('📚');
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);

  // Search state
  const [cardSearch, setCardSearch] = useState('');

  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!selectedCard) setIsEditing(false);
  }, [selectedCard]);

  function handleStartEdit() {
    if (!selectedCard) return;
    setEditQuestion(selectedCard.question);
    setEditAnswer(selectedCard.answer);
    setEditQuestionImage(selectedCard.questionImage);
    setEditAnswerImage(selectedCard.answerImage);
    setIsEditing(true);
  }

  async function handleSaveCard() {
    if (!selectedCard) return;
    setIsSaving(true);
    try {
      await updateFlashcard(deckId, selectedCard.id, editQuestion.trim(), editAnswer.trim(), editQuestionImage, editAnswerImage);
      updateCardInStore(deckId, selectedCard.id, editQuestion.trim(), editAnswer.trim(), editQuestionImage, editAnswerImage);
      setSelectedCard((c) => c ? { ...c, question: editQuestion.trim(), answer: editAnswer.trim(), questionImage: editQuestionImage, answerImage: editAnswerImage } : c);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetSRS() {
    if (!selectedCard) return;
    Alert.alert(
      'Resetar progresso',
      'Isso vai apagar o histórico e SRS deste card. Ele voltará a aparecer como novo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetFlashcardSRSApi(deckId, selectedCard.id);
              resetSRSInStore(deckId, selectedCard.id);
              setSelectedCard((c) =>
                c ? { ...c, srs: undefined, stats: { timesStudied: 0, timesCorrect: 0, timesWrong: 0, timesDoubt: 0 } } : c
              );
            } catch {
              Alert.alert('Erro', 'Não foi possível resetar o progresso.');
            }
          },
        },
      ]
    );
  }

  function handleDeleteCard() {
    if (!selectedCard) return;
    Alert.alert(
      'Deletar Card',
      'Tem certeza que deseja deletar este flashcard?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteFlashcardApi(deckId, selectedCard.id);
              removeFlashcard(deckId, selectedCard.id);
              setSelectedCard(null);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }

  function handleOpenEditDeck() {
    if (!deck) return;
    setEditTitle(deck.title);
    setEditDescription(deck.description ?? '');
    setEditEmoji(deck.coverEmoji);
    setShowEditDeck(true);
  }

  async function handleSaveDeck() {
    if (!editTitle.trim()) return;
    setIsSavingDeck(true);
    try {
      const patch = { title: editTitle.trim(), description: editDescription.trim(), coverEmoji: editEmoji };
      await updateDeckApi(deckId, patch);
      updateDeckInStore(deckId, patch);
      setShowEditDeck(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
      Alert.alert('Erro', msg);
    } finally {
      setIsSavingDeck(false);
    }
  }

  function handleDeleteDeck() {
    Alert.alert(
      'Deletar Deck',
      `Tem certeza que deseja deletar "${deck?.title}"? Todos os flashcards serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingDeck(true);
            try {
              await deleteDeckApi(deckId);
              removeDeck(deckId);
              router.back();
            } catch {
              Alert.alert('Erro', 'Não foi possível deletar o deck.');
            } finally {
              setIsDeletingDeck(false);
            }
          },
        },
      ]
    );
  }

  const filteredCards = useMemo(() => {
    if (!cardSearch.trim()) return cards;
    const q = cardSearch.toLowerCase();
    return cards.filter(
      (c) => c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q)
    );
  }, [cards, cardSearch]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  function getResultIcon(card: FlashCard) {
    const result = card.stats.lastResult;
    if (!result) return <Minus size={16} color={theme.colors.textSecondary} />;
    if (result === 'correct') return <CheckCircle size={16} color={theme.colors.success} weight="fill" />;
    if (result === 'wrong') return <XCircle size={16} color={theme.colors.error} weight="fill" />;
    return <Question size={16} color={theme.colors.warning} weight="fill" />;
  }

  if (isLoadingFlashcards) return <FlashcardListSkeleton />;

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
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          {deck && (
            <Box marginLeft="s">
              <DeckIconBox emoji={deck.coverEmoji} deckId={deck.id} size={18} boxSize={36} borderRadius={6} colors={theme.colors} />
            </Box>
          )}
          <Box marginLeft="m" flex={1}>
            <Text variant="h3" color="textPrimary" numberOfLines={1}>{deck?.title ?? 'Deck'}</Text>
          </Box>
          <TouchableOpacity
            onPress={handleOpenEditDeck}
            accessibilityLabel="Editar deck"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <DotsThreeVertical size={20} color={theme.colors.textSecondary} weight="bold" />
          </TouchableOpacity>
        </Box>

        {/* Progress summary */}
        {progress && (
          <Box
            backgroundColor="white"
            margin="m"
            borderRadius="m"
            padding="m"
            style={{ borderWidth: 1, borderColor: theme.colors.border }}
          >
            <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
              <Text variant="caption" color="textSecondary">{progress.totalCards} cards</Text>
              <Box flexDirection="row" style={{ gap: 8 }}>
                {(progress.dueCount ?? 0) > 0 && (
                  <Text variant="caption" color="textPrimary" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {progress.dueCount} para hoje
                  </Text>
                )}
                <Text variant="caption" color="success" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {progress.completionPercentage}% dom.
                </Text>
              </Box>
            </Box>
            <ProgressBar
              segments={[
                { value: progress.mastered, color: 'success' },
                { value: progress.learning, color: 'warning' },
                { value: progress.notStarted, color: 'border' },
              ]}
              height={4}
            />
            <Box flexDirection="row" marginTop="m" justifyContent="space-around">
              <Box alignItems="center">
                <Text variant="h3" color="success">{progress.mastered}</Text>
                <Text variant="caption" color="textSecondary">Dominei</Text>
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

        {/* Search bar */}
        {cards.length > 0 && (
          <Box
            flexDirection="row"
            alignItems="center"
            backgroundColor="surfaceLight"
            borderRadius="s"
            paddingHorizontal="m"
            marginHorizontal="m"
            marginBottom="s"
            style={{ borderWidth: 1, borderColor: theme.colors.border }}
          >
            <MagnifyingGlass size={14} color={theme.colors.textSecondary} />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: theme.spacing.s,
                fontFamily: 'Poppins_400Regular',
                fontSize: 13,
                color: theme.colors.textPrimary,
              }}
              placeholder="Buscar cards..."
              placeholderTextColor={theme.colors.textSecondary}
              value={cardSearch}
              onChangeText={setCardSearch}
            />
          </Box>
        )}

        {/* Flashcard list */}
        {cards.length === 0 ? (
          <EmptyState emoji="📋" title="Sem flashcards" description="Este deck não tem cards ainda." />
        ) : filteredCards.length === 0 ? (
          <EmptyState emoji="🔍" title="Nenhum resultado" description={`Nenhum card encontrado para "${cardSearch}".`} />
        ) : (
          <FlatList
            data={filteredCards}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.m, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSelectedCard(item)} accessibilityLabel={`Card ${item.order}`} style={{ marginBottom: 6 }}>
                <Box
                  backgroundColor="white"
                  borderRadius="s"
                  padding="m"
                  flexDirection="row"
                  alignItems="center"
                  style={{ borderWidth: 1, borderColor: theme.colors.border }}
                >
                  <Text variant="caption" color="textSecondary" style={{ fontFamily: 'Poppins_600SemiBold', width: 28 }}>
                    {item.order}
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

        {/* Add card FAB */}
        <TouchableOpacity
          onPress={() => router.push(`/(main)/decks/${deckId}/add-card`)}
          accessibilityLabel="Adicionar flashcard"
          style={{
            position: 'absolute',
            bottom: cards.length > 0 ? 120 : 32,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surfaceLight,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Plus size={18} color={theme.colors.textPrimary} weight="bold" />
        </TouchableOpacity>

        {/* Study buttons */}
        {cards.length > 0 && (
          <Box
            backgroundColor="surface"
            padding="m"
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingBottom: insets.bottom + 12,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              gap: 8,
            }}
          >
            <Button label="Estudar Deck" onPress={() => router.push(`/(main)/decks/${deckId}/study`)} fullWidth />
            {(deck?.progress?.dueCount ?? 0) < cards.length && (
              <TouchableOpacity onPress={() => router.push(`/(main)/decks/${deckId}/study?all=1`)}>
                <Box borderRadius="s" alignItems="center" style={{ height: 38, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: theme.colors.textSecondary }}>Estudar todos ({cards.length})</Text>
                </Box>
              </TouchableOpacity>
            )}
          </Box>
        )}

        {/* ── Card detail modal ── */}
        <Modal visible={!!selectedCard} animationType="slide" transparent onRequestClose={() => setSelectedCard(null)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setSelectedCard(null)}
          >
            <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
              <View
                style={{
                  backgroundColor: theme.colors.surfaceLight,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingHorizontal: 24,
                  paddingTop: 16,
                  maxHeight: height * 0.8,
                  paddingBottom: insets.bottom + 16,
                }}
              >
                <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="l">
                  {isEditing ? (
                    <TouchableOpacity onPress={() => setIsEditing(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleDeleteCard} disabled={isDeleting} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Trash size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  )}
                  <Box width={32} height={3} borderRadius="round" backgroundColor="border" />
                  {isEditing ? (
                    <TouchableOpacity onPress={handleSaveCard} disabled={isSaving} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textPrimary }}>
                        {isSaving ? 'Salvando...' : 'Salvar'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleStartEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <PencilSimple size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </Box>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Pergunta
                  </Text>
                  {isEditing ? (
                    <>
                      <TextInput value={editQuestion} onChangeText={setEditQuestion} multiline
                        style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, padding: 12, minHeight: 80, textAlignVertical: 'top', marginBottom: 12, backgroundColor: theme.colors.surfaceLight }}
                      />
                      <ImagePickerField label="Imagem da pergunta" value={editQuestionImage} onChange={setEditQuestionImage} />
                    </>
                  ) : (
                    <>
                      <Text variant="body" marginBottom={selectedCard?.questionImage ? 's' : 'l'}>{selectedCard?.question}</Text>
                      {selectedCard?.questionImage && (
                        <Image source={{ uri: selectedCard.questionImage }} style={{ width: '100%', height: 150, borderRadius: 6, marginBottom: 16 }} resizeMode="contain" />
                      )}
                    </>
                  )}

                  <Box height={1} backgroundColor="border" marginBottom="l" marginTop={isEditing ? 'm' : undefined} />

                  <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.success, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Resposta
                  </Text>
                  {isEditing ? (
                    <>
                      <TextInput value={editAnswer} onChangeText={setEditAnswer} multiline
                        style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, padding: 12, minHeight: 100, textAlignVertical: 'top', marginBottom: 12, backgroundColor: theme.colors.surfaceLight }}
                      />
                      <ImagePickerField label="Imagem da resposta" value={editAnswerImage} onChange={setEditAnswerImage} />
                    </>
                  ) : (
                    <>
                      <Text variant="body" marginBottom={selectedCard?.answerImage ? 's' : 'm'}>{selectedCard?.answer}</Text>
                      {selectedCard?.answerImage && (
                        <Image source={{ uri: selectedCard.answerImage }} style={{ width: '100%', height: 150, borderRadius: 6, marginBottom: 16 }} resizeMode="contain" />
                      )}
                    </>
                  )}

                  {/* SRS info */}
                  {!isEditing && (
                    <Box marginTop="m" style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 }}>
                      {selectedCard?.srs && selectedCard.srs.repetitions > 0 ? (
                        <>
                          <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                            Próxima revisão
                          </Text>
                          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                            <Text variant="caption" color="textSecondary">
                              Intervalo: {selectedCard.srs.interval} {selectedCard.srs.interval === 1 ? 'dia' : 'dias'} · Facilidade: {selectedCard.srs.easeFactor.toFixed(1)}
                            </Text>
                            <TouchableOpacity onPress={handleResetSRS} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Text style={{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: theme.colors.error }}>Resetar</Text>
                            </TouchableOpacity>
                          </Box>
                        </>
                      ) : (
                        <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary, opacity: 0.6 }}>
                          Card novo — ainda não estudado
                        </Text>
                      )}
                    </Box>
                  )}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ── Edit deck modal ── */}
        <Modal visible={showEditDeck} animationType="slide" transparent onRequestClose={() => setShowEditDeck(false)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setShowEditDeck(false)}
          >
            <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
              <View
                style={{
                  backgroundColor: theme.colors.surfaceLight,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingHorizontal: 24,
                  paddingTop: 16,
                  paddingBottom: insets.bottom + 24,
                }}
              >
                <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="l">
                  <TouchableOpacity onPress={() => setShowEditDeck(false)}>
                    <X size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <Box width={32} height={3} borderRadius="round" backgroundColor="border" />
                  <TouchableOpacity onPress={handleSaveDeck} disabled={isSavingDeck}>
                    <Text style={{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textPrimary }}>
                      {isSavingDeck ? 'Salvando...' : 'Salvar'}
                    </Text>
                  </TouchableOpacity>
                </Box>

                <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>
                  Título
                </Text>
                <TextInput
                  value={editTitle}
                  onChangeText={(t) => setEditTitle(t.slice(0, 60))}
                  style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, padding: 12, marginBottom: 16, backgroundColor: theme.colors.surfaceLight }}
                />

                <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 }}>
                  Descrição
                </Text>
                <TextInput
                  value={editDescription}
                  onChangeText={(t) => setEditDescription(t.slice(0, 200))}
                  multiline
                  style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, padding: 12, minHeight: 64, textAlignVertical: 'top', marginBottom: 16, backgroundColor: theme.colors.surfaceLight }}
                />

                <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>
                  Ícone
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Box flexDirection="row" style={{ gap: 8 }}>
                    {EMOJI_OPTIONS.map((e) => (
                      <TouchableOpacity key={e} onPress={() => setEditEmoji(e)}>
                        <View style={{ padding: 3, borderRadius: 10, borderWidth: 2, borderColor: editEmoji === e ? theme.colors.primaryDark : 'transparent' }}>
                          <DeckIconBox emoji={e} deckId={e} size={20} boxSize={40} borderRadius={8} colors={theme.colors} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </Box>
                </ScrollView>

                <TouchableOpacity
                  onPress={handleDeleteDeck}
                  disabled={isDeletingDeck}
                  style={{ marginTop: 24 }}
                >
                  <Box borderRadius="s" alignItems="center" style={{ height: 44, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.error }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: theme.colors.error }}>
                      {isDeletingDeck ? 'Deletando...' : 'Deletar Deck'}
                    </Text>
                  </Box>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </Box>
    </SafeAreaView>
  );
}
