import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { ArrowLeft, Minus, Plus, Trash } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '../../components/ui/Box';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { createDeck, createManualDeck } from '../../services/api/decks';
import ImagePickerField from '../../components/ui/ImagePickerField';
import { useDeckStore } from '../../stores/deckStore';
import { FlashCard } from '../../types/flashcard';
import { Deck } from '../../types/deck';
import { isValidDeckTitle, isValidPrompt, isValidCardCount } from '../../utils/validators';
import { DeckIconBox } from '../../utils/deckIcon';
import { Theme } from '../../theme';

const EMOJI_OPTIONS = ['📚', '📖', '💡', '🧠', '💻', '🧬', '🔬', '🌍', '🎨', '🏆', '🎵', '🧩', '🗣️', '❤️', '📊'];

const LOADING_MESSAGES = [
  'Analisando o tema...',
  'Criando perguntas...',
  'Formulando respostas...',
  'Organizando os cards...',
  'Quase lá...',
];

type Mode = 'ai' | 'manual';

interface ManualCard {
  id: string;
  question: string;
  answer: string;
  questionImage?: string;
  answerImage?: string;
}

export default function CreateDeckScreen() {
  const theme = useTheme<Theme>();
  const { addDeck, setFlashcards } = useDeckStore();

  const [mode, setMode] = useState<Mode>('ai');

  // Shared fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI mode fields
  const [prompt, setPrompt] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [previewDeck, setPreviewDeck] = useState<Deck | null>(null);
  const [previewCards, setPreviewCards] = useState<FlashCard[]>([]);

  // Manual mode fields
  const [manualCards, setManualCards] = useState<ManualCard[]>([
    { id: '1', question: '', answer: '' },
  ]);
  const [isSavingManual, setIsSavingManual] = useState(false);

  const loadingMsgRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (isGenerating) {
      let idx = 0;
      loadingMsgRef.current = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[idx]);
      }, 1000);
    } else {
      clearInterval(loadingMsgRef.current);
    }
    return () => clearInterval(loadingMsgRef.current);
  }, [isGenerating]);

  // ─── Shared helpers ──────────────────────────────────────────────────────────

  function handleBack() {
    const hasContent = title || description || prompt || manualCards.some((c) => c.question || c.answer);
    if (hasContent) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem conteúdo não salvo. Deseja sair?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
  }

  // ─── AI mode ─────────────────────────────────────────────────────────────────

  function validateAI(): boolean {
    const newErrors: Record<string, string> = {};
    if (!isValidDeckTitle(title)) newErrors.title = 'Título é obrigatório (máx. 60 caracteres).';
    if (!isValidPrompt(prompt)) newErrors.prompt = 'Descreva o tema com pelo menos 20 caracteres.';
    if (!isValidCardCount(cardCount)) newErrors.cardCount = 'Quantidade deve ser entre 5 e 30.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleGenerate() {
    if (!validateAI()) return;
    setIsGenerating(true);
    setPreviewDeck(null);
    setPreviewCards([]);
    try {
      const response = await createDeck({
        title: title.trim(),
        description: description.trim(),
        prompt: prompt.trim(),
        numberOfCards: cardCount,
      });
      response.deck.coverEmoji = emoji;
      setPreviewDeck(response.deck);
      setPreviewCards(response.flashcards);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar os flashcards.';
      Alert.alert('Erro', message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSaveAI() {
    if (!previewDeck) return;
    addDeck(previewDeck);
    setFlashcards(previewDeck.id, previewCards);
    router.replace(`/(main)/decks/${previewDeck.id}`);
  }

  // ─── Manual mode ─────────────────────────────────────────────────────────────

  function addCard() {
    setManualCards((prev) => [
      ...prev,
      { id: String(Date.now()), question: '', answer: '' },
    ]);
  }

  function removeCard(id: string) {
    if (manualCards.length === 1) return;
    setManualCards((prev) => prev.filter((c) => c.id !== id));
  }

  function updateCard(id: string, field: keyof ManualCard, value: string | undefined) {
    setManualCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    if (errors[`card_${id}_${field}`]) {
      setErrors((e) => { const next = { ...e }; delete next[`card_${id}_${field}`]; return next; });
    }
  }

  function validateManual(): boolean {
    const newErrors: Record<string, string> = {};
    if (!isValidDeckTitle(title)) newErrors.title = 'Título é obrigatório (máx. 60 caracteres).';
    const filledCards = manualCards.filter((c) => c.question.trim() || c.answer.trim());
    if (filledCards.length === 0) newErrors.cards = 'Adicione pelo menos um card.';
    manualCards.forEach((c) => {
      if (c.question.trim() && !c.answer.trim()) newErrors[`card_${c.id}_answer`] = 'Resposta obrigatória.';
      if (!c.question.trim() && c.answer.trim()) newErrors[`card_${c.id}_question`] = 'Pergunta obrigatória.';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSaveManual() {
    if (!validateManual()) return;
    setIsSavingManual(true);
    try {
      const cards = manualCards
        .filter((c) => c.question.trim() && c.answer.trim())
        .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }));
      const response = await createManualDeck(title.trim(), description.trim() || undefined, emoji, cards);
      addDeck(response.deck);
      setFlashcards(response.deck.id, response.flashcards);
      router.replace(`/(main)/decks/${response.deck.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar o deck.';
      Alert.alert('Erro', message);
    } finally {
      setIsSavingManual(false);
    }
  }

  // ─── Shared sections ──────────────────────────────────────────────────────────

  function renderBaseFields() {
    return (
      <>
        <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="m">
          <Input
            label="Título do Deck *"
            value={title}
            onChangeText={(t) => { setTitle(t.slice(0, 60)); if (errors.title) setErrors((e) => ({ ...e, title: '' })); }}
            placeholder="Ex: Gramática Inglesa"
            error={errors.title}
            maxLength={60}
          />
          <Input
            label="Descrição (opcional)"
            value={description}
            onChangeText={(t) => setDescription(t.slice(0, 200))}
            placeholder="Breve descrição do conteúdo"
            maxLength={200}
          />
        </Box>

        <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="m">
          <Text variant="label" marginBottom="s">Ícone do Deck</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Box flexDirection="row" style={{ gap: 10 }}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity key={e} onPress={() => setEmoji(e)} accessibilityLabel={`Ícone ${e}`}>
                  <Box style={{ padding: 3, borderRadius: 14, borderWidth: 2.5, borderColor: emoji === e ? theme.colors.primaryDark : 'transparent' }}>
                    <DeckIconBox emoji={e} deckId={e} size={22} boxSize={44} borderRadius={10} colors={theme.colors} />
                  </Box>
                </TouchableOpacity>
              ))}
            </Box>
          </ScrollView>
        </Box>
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Box flex={1} backgroundColor="surface">
          {/* Header */}
          <Box
            flexDirection="row"
            alignItems="center"
            padding="m"
            style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
          >
            <TouchableOpacity onPress={handleBack} accessibilityLabel="Voltar">
              <ArrowLeft size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text variant="h3" color="textPrimary" marginLeft="m">
              Criar Novo Deck
            </Text>
          </Box>

          {/* Mode toggle */}
          <Box
            flexDirection="row"
            marginHorizontal="m"
            marginTop="m"
            marginBottom="s"
            backgroundColor="surfaceLight"
            borderRadius="m"
            padding="xs"
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => switchMode('ai')}
              accessibilityLabel="Modo IA"
            >
              <Box
                padding="s"
                borderRadius="s"
                alignItems="center"
                style={{ backgroundColor: mode === 'ai' ? theme.colors.white : 'transparent' }}
              >
                <Text
                  variant="bodySmall"
                  color={mode === 'ai' ? 'primaryDark' : 'textSecondary'}
                  style={{ fontFamily: mode === 'ai' ? 'Poppins_600SemiBold' : 'Poppins_400Regular' }}
                >
                  IA ✨
                </Text>
              </Box>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => switchMode('manual')}
              accessibilityLabel="Modo manual"
            >
              <Box
                padding="s"
                borderRadius="s"
                alignItems="center"
                style={{ backgroundColor: mode === 'manual' ? theme.colors.white : 'transparent' }}
              >
                <Text
                  variant="bodySmall"
                  color={mode === 'manual' ? 'primaryDark' : 'textSecondary'}
                  style={{ fontFamily: mode === 'manual' ? 'Poppins_600SemiBold' : 'Poppins_400Regular' }}
                >
                  Manual 📝
                </Text>
              </Box>
            </TouchableOpacity>
          </Box>

          <ScrollView
            contentContainerStyle={{ padding: theme.spacing.m, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderBaseFields()}

            {/* ─── AI mode ───────────────────────────────────────────────────── */}
            {mode === 'ai' && (
              <>
                <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="m">
                  <Text variant="label" marginBottom="s">
                    Sobre o que você quer estudar? *
                  </Text>
                  <View
                    style={{
                      backgroundColor: theme.colors.white,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: errors.prompt ? theme.colors.error : theme.colors.border,
                      padding: 12,
                    }}
                  >
                    <TextInput
                      value={prompt}
                      onChangeText={setPrompt}
                      placeholder="Ex: Principais eventos da Segunda Guerra Mundial, focando em datas e personagens importantes..."
                      placeholderTextColor={theme.colors.textSecondary}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                      style={{
                        fontFamily: 'Poppins_400Regular',
                        fontSize: 15,
                        color: theme.colors.textPrimary,
                        minHeight: 120,
                      }}
                      accessibilityLabel="Tema para gerar flashcards"
                    />
                  </View>
                  {errors.prompt && (
                    <Text variant="caption" color="error" marginTop="xs">{errors.prompt}</Text>
                  )}
                  <Text variant="caption" color="textSecondary" marginTop="xs">
                    {prompt.length} / mínimo 20 caracteres
                  </Text>
                </Box>

                <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="l">
                  <Text variant="label" marginBottom="s">
                    Quantidade de Flashcards: {cardCount}
                  </Text>
                  <Box flexDirection="row" alignItems="center" style={{ gap: 16 }}>
                    <TouchableOpacity onPress={() => setCardCount((v) => Math.max(5, v - 1))} accessibilityLabel="Diminuir quantidade">
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={20} color={theme.colors.textPrimary} />
                      </View>
                    </TouchableOpacity>
                    <View style={{ flex: 1, backgroundColor: theme.colors.white, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
                      <Text variant="h3" color="primaryDark">{cardCount}</Text>
                      <Text variant="caption" color="textSecondary">cards</Text>
                    </View>
                    <TouchableOpacity onPress={() => setCardCount((v) => Math.min(30, v + 1))} accessibilityLabel="Aumentar quantidade">
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={20} color={theme.colors.textPrimary} />
                      </View>
                    </TouchableOpacity>
                  </Box>
                  <Text variant="caption" color="textSecondary" marginTop="xs">
                    Mínimo: 5 | Máximo: 30
                  </Text>
                </Box>

                <Button
                  label={isGenerating ? loadingMessage : 'Gerar Flashcards com IA ✨'}
                  onPress={handleGenerate}
                  isLoading={isGenerating}
                  fullWidth
                />

                {previewDeck && previewCards.length > 0 && !isGenerating && (
                  <Box marginTop="xl">
                    <Box backgroundColor="white" borderRadius="l" padding="m" marginBottom="m" style={{ elevation: 2 }}>
                      <Box flexDirection="row" alignItems="center">
                        <DeckIconBox emoji={previewDeck.coverEmoji} deckId={previewDeck.id} size={24} boxSize={52} colors={theme.colors} />
                        <Box marginLeft="m">
                          <Text variant="h3" color="textPrimary">{previewDeck.title}</Text>
                          <Text variant="caption" color="textSecondary">{previewCards.length} flashcards gerados</Text>
                        </Box>
                      </Box>
                    </Box>

                    {previewCards.map((card, idx) => (
                      <Box key={card.id} backgroundColor="white" borderRadius="m" padding="m" marginBottom="s" style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primaryDark }}>
                        <Text variant="caption" color="primaryDark" style={{ fontFamily: 'Poppins_600SemiBold' }}>Card #{idx + 1}</Text>
                        <Text variant="bodySmall" color="textPrimary" marginTop="xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>{card.question}</Text>
                        <Text variant="caption" color="textSecondary" marginTop="xs">{card.answer}</Text>
                      </Box>
                    ))}

                    <Box marginTop="l" style={{ gap: 12 }}>
                      <Button label="Salvar Deck" onPress={handleSaveAI} fullWidth />
                      <Button label="Gerar Novamente" onPress={handleGenerate} variant="ghost" fullWidth />
                    </Box>
                  </Box>
                )}
              </>
            )}

            {/* ─── Manual mode ───────────────────────────────────────────────── */}
            {mode === 'manual' && (
              <>
                {errors.cards && (
                  <Text variant="caption" color="error" marginBottom="s">{errors.cards}</Text>
                )}

                {manualCards.map((card, idx) => (
                  <Box
                    key={card.id}
                    backgroundColor="surfaceLight"
                    borderRadius="l"
                    padding="m"
                    marginBottom="m"
                  >
                    <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="s">
                      <Text variant="bodySmall" color="textSecondary" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Card {idx + 1}
                      </Text>
                      {manualCards.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeCard(card.id)}
                          accessibilityLabel={`Remover card ${idx + 1}`}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </Box>

                    <Text variant="label" marginBottom="xs">Pergunta *</Text>
                    <TextInput
                      value={card.question}
                      onChangeText={(t) => updateCard(card.id, 'question', t)}
                      placeholder="Digite a pergunta..."
                      placeholderTextColor={theme.colors.textSecondary}
                      multiline
                      textAlignVertical="top"
                      style={{
                        fontFamily: 'Poppins_400Regular',
                        fontSize: 14,
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.white,
                        borderWidth: 1.5,
                        borderColor: errors[`card_${card.id}_question`] ? theme.colors.error : theme.colors.border,
                        borderRadius: 10,
                        padding: 12,
                        minHeight: 80,
                        marginBottom: 4,
                      }}
                    />
                    {errors[`card_${card.id}_question`] && (
                      <Text variant="caption" color="error" marginBottom="s">{errors[`card_${card.id}_question`]}</Text>
                    )}
                    <ImagePickerField
                      label="Imagem da pergunta"
                      value={card.questionImage}
                      onChange={(uri) => updateCard(card.id, 'questionImage', uri)}
                    />

                    <Text variant="label" marginBottom="xs" marginTop="m">Resposta *</Text>
                    <TextInput
                      value={card.answer}
                      onChangeText={(t) => updateCard(card.id, 'answer', t)}
                      placeholder="Digite a resposta..."
                      placeholderTextColor={theme.colors.textSecondary}
                      multiline
                      textAlignVertical="top"
                      style={{
                        fontFamily: 'Poppins_400Regular',
                        fontSize: 14,
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.white,
                        borderWidth: 1.5,
                        borderColor: errors[`card_${card.id}_answer`] ? theme.colors.error : theme.colors.border,
                        borderRadius: 10,
                        padding: 12,
                        minHeight: 80,
                        marginBottom: 4,
                      }}
                    />
                    {errors[`card_${card.id}_answer`] && (
                      <Text variant="caption" color="error">{errors[`card_${card.id}_answer`]}</Text>
                    )}
                    <ImagePickerField
                      label="Imagem da resposta"
                      value={card.answerImage}
                      onChange={(uri) => updateCard(card.id, 'answerImage', uri)}
                    />
                  </Box>
                ))}

                <TouchableOpacity onPress={addCard} accessibilityLabel="Adicionar card">
                  <Box
                    borderRadius="l"
                    padding="m"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="row"
                    style={{ gap: 8, borderWidth: 2, borderColor: theme.colors.primaryDark, borderStyle: 'dashed' }}
                  >
                    <Plus size={20} color={theme.colors.primaryDark} />
                    <Text variant="bodySmall" color="primaryDark" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Adicionar Card
                    </Text>
                  </Box>
                </TouchableOpacity>

                <Box marginTop="l">
                  <Button
                    label={isSavingManual ? 'Salvando...' : `Salvar Deck (${manualCards.filter((c) => c.question.trim() && c.answer.trim()).length} cards)`}
                    onPress={handleSaveManual}
                    isLoading={isSavingManual}
                    fullWidth
                  />
                </Box>
              </>
            )}
          </ScrollView>
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
