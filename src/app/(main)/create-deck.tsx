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
import { ArrowLeft, Minus, Plus } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '../../components/ui/Box';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { createDeck } from '../../services/api/decks';
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

export default function CreateDeckScreen() {
  const theme = useTheme<Theme>();
  const { addDeck, setFlashcards } = useDeckStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [prompt, setPrompt] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [previewDeck, setPreviewDeck] = useState<Deck | null>(null);
  const [previewCards, setPreviewCards] = useState<FlashCard[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!isValidDeckTitle(title)) newErrors.title = 'Título é obrigatório (máx. 60 caracteres).';
    if (!isValidPrompt(prompt)) newErrors.prompt = 'Descreva o tema com pelo menos 20 caracteres.';
    if (!isValidCardCount(cardCount)) newErrors.cardCount = 'Quantidade deve ser entre 5 e 30.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleGenerate() {
    if (!validate()) return;
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

  function handleSave() {
    if (!previewDeck) return;
    addDeck(previewDeck);
    setFlashcards(previewDeck.id, previewCards);
    router.replace(`/(main)/decks/${previewDeck.id}`);
  }

  function handleBack() {
    if (title || description || prompt) {
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

          <ScrollView
            contentContainerStyle={{ padding: theme.spacing.m, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Basic info */}
            <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="m">
              <Input
                label="Título do Deck *"
                value={title}
                onChangeText={(t) => setTitle(t.slice(0, 60))}
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

            {/* Icon selector */}
            <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="m">
              <Text variant="label" marginBottom="s">
                Ícone do Deck
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Box flexDirection="row" style={{ gap: 10 }}>
                  {EMOJI_OPTIONS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setEmoji(e)}
                      accessibilityLabel={`Ícone ${e}`}
                    >
                      <Box
                        style={{
                          padding: 3,
                          borderRadius: 14,
                          borderWidth: 2.5,
                          borderColor: emoji === e ? theme.colors.primaryDark : 'transparent',
                        }}
                      >
                        <DeckIconBox
                          emoji={e}
                          deckId={e}
                          size={22}
                          boxSize={44}
                          borderRadius={10}
                          colors={theme.colors}
                        />
                      </Box>
                    </TouchableOpacity>
                  ))}
                </Box>
              </ScrollView>
            </Box>

            {/* Prompt */}
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
                <Text variant="caption" color="error" marginTop="xs">
                  {errors.prompt}
                </Text>
              )}
              <Text variant="caption" color="textSecondary" marginTop="xs">
                {prompt.length} / mínimo 20 caracteres
              </Text>
            </Box>

            {/* Card count */}
            <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="l">
              <Text variant="label" marginBottom="s">
                Quantidade de Flashcards: {cardCount}
              </Text>
              <Box flexDirection="row" alignItems="center" style={{ gap: 16 }}>
                <TouchableOpacity
                  onPress={() => setCardCount((v) => Math.max(5, v - 1))}
                  accessibilityLabel="Diminuir quantidade"
                >
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: theme.colors.white,
                      borderWidth: 1, borderColor: theme.colors.border,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Minus size={20} color={theme.colors.textPrimary} />
                  </View>
                </TouchableOpacity>
                <View
                  style={{
                    flex: 1, backgroundColor: theme.colors.white,
                    borderRadius: 12, padding: 12, alignItems: 'center',
                    borderWidth: 1, borderColor: theme.colors.border,
                  }}
                >
                  <Text variant="h3" color="primaryDark">{cardCount}</Text>
                  <Text variant="caption" color="textSecondary">cards</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setCardCount((v) => Math.min(30, v + 1))}
                  accessibilityLabel="Aumentar quantidade"
                >
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: theme.colors.white,
                      borderWidth: 1, borderColor: theme.colors.border,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Plus size={20} color={theme.colors.textPrimary} />
                  </View>
                </TouchableOpacity>
              </Box>
              <Text variant="caption" color="textSecondary" marginTop="xs">
                Mínimo: 5 | Máximo: 30
              </Text>
            </Box>

            {/* Generate button */}
            <Button
              label={isGenerating ? loadingMessage : 'Gerar Flashcards com IA ✨'}
              onPress={handleGenerate}
              isLoading={isGenerating}
              fullWidth
            />

            {/* Preview */}
            {previewDeck && previewCards.length > 0 && !isGenerating && (
              <Box marginTop="xl">
                <Box backgroundColor="white" borderRadius="l" padding="m" marginBottom="m" style={{ elevation: 2 }}>
                  <Box flexDirection="row" alignItems="center">
                    <DeckIconBox
                      emoji={previewDeck.coverEmoji}
                      deckId={previewDeck.id}
                      size={24}
                      boxSize={52}
                      colors={theme.colors}
                    />
                    <Box marginLeft="m">
                      <Text variant="h3" color="textPrimary">{previewDeck.title}</Text>
                      <Text variant="caption" color="textSecondary">
                        {previewCards.length} flashcards gerados
                      </Text>
                    </Box>
                  </Box>
                </Box>

                {previewCards.map((card, idx) => (
                  <Box
                    key={card.id}
                    backgroundColor="white"
                    borderRadius="m"
                    padding="m"
                    marginBottom="s"
                    style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.primaryDark }}
                  >
                    <Text variant="caption" color="primaryDark" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Card #{idx + 1}
                    </Text>
                    <Text variant="bodySmall" color="textPrimary" marginTop="xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {card.question}
                    </Text>
                    <Text variant="caption" color="textSecondary" marginTop="xs">
                      {card.answer}
                    </Text>
                  </Box>
                ))}

                <Box marginTop="l" style={{ gap: 12 }}>
                  <Button label="Salvar Deck" onPress={handleSave} fullWidth />
                  <Button
                    label="Gerar Novamente"
                    onPress={handleGenerate}
                    variant="ghost"
                    fullWidth
                  />
                </Box>
              </Box>
            )}
          </ScrollView>
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
