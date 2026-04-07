import React, { useState } from 'react';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { ArrowLeft } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '../../../../components/ui/Box';
import Text from '../../../../components/ui/Text';
import Button from '../../../../components/ui/Button';
import ImagePickerField from '../../../../components/ui/ImagePickerField';
import { createFlashcard } from '../../../../services/api/flashcards';
import { useDeckStore } from '../../../../stores/deckStore';
import { Theme } from '../../../../theme';

export default function AddCardScreen() {
  const theme = useTheme<Theme>();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { addFlashcard } = useDeckStore();
  const deck = useDeckStore((s) => s.decks.find((d) => d.id === deckId));

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [questionImage, setQuestionImage] = useState<string | undefined>();
  const [answerImage, setAnswerImage] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ question?: string; answer?: string }>({});

  function validate(): boolean {
    const newErrors: { question?: string; answer?: string } = {};
    if (!question.trim()) newErrors.question = 'A pergunta é obrigatória.';
    if (!answer.trim()) newErrors.answer = 'A resposta é obrigatória.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave(andAddAnother = false) {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const { flashcard } = await createFlashcard(
        deckId,
        question.trim(),
        answer.trim(),
        questionImage,
        answerImage
      );
      addFlashcard(deckId, flashcard);
      if (andAddAnother) {
        setQuestion('');
        setAnswer('');
        setQuestionImage(undefined);
        setAnswerImage(undefined);
        setErrors({});
      } else {
        router.back();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar o card.';
      Alert.alert('Erro', message);
    } finally {
      setIsSaving(false);
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
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityLabel="Voltar"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Box marginLeft="m" flex={1}>
              <Text variant="h3" color="textPrimary">Adicionar Card</Text>
              {deck && (
                <Text variant="caption" color="textSecondary" numberOfLines={1}>
                  {deck.title}
                </Text>
              )}
            </Box>
          </Box>

          <ScrollView
            contentContainerStyle={{ padding: theme.spacing.m, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Question */}
            <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="m">
              <Text variant="label" marginBottom="xs">Pergunta *</Text>
              <TextInput
                value={question}
                onChangeText={(t) => { setQuestion(t); if (errors.question) setErrors((e) => ({ ...e, question: undefined })); }}
                placeholder="Ex: Qual é a capital do Brasil?"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 15,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.white,
                  borderWidth: 1.5,
                  borderColor: errors.question ? theme.colors.error : theme.colors.border,
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 90,
                }}
                accessibilityLabel="Pergunta do card"
              />
              {errors.question && (
                <Text variant="caption" color="error" marginTop="xs">{errors.question}</Text>
              )}
              <ImagePickerField
                label="Imagem da pergunta"
                value={questionImage}
                onChange={setQuestionImage}
              />
            </Box>

            {/* Answer */}
            <Box backgroundColor="surfaceLight" borderRadius="l" padding="m" marginBottom="xl">
              <Text variant="label" marginBottom="xs">Resposta *</Text>
              <TextInput
                value={answer}
                onChangeText={(t) => { setAnswer(t); if (errors.answer) setErrors((e) => ({ ...e, answer: undefined })); }}
                placeholder="Ex: Brasília"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 15,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.white,
                  borderWidth: 1.5,
                  borderColor: errors.answer ? theme.colors.error : theme.colors.border,
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 90,
                }}
                accessibilityLabel="Resposta do card"
              />
              {errors.answer && (
                <Text variant="caption" color="error" marginTop="xs">{errors.answer}</Text>
              )}
              <ImagePickerField
                label="Imagem da resposta"
                value={answerImage}
                onChange={setAnswerImage}
              />
            </Box>

            {/* Actions */}
            <Box style={{ gap: 12 }}>
              <Button
                label={isSaving ? 'Salvando...' : 'Salvar Card'}
                onPress={() => handleSave(false)}
                isLoading={isSaving}
                fullWidth
              />
              <Button
                label="Salvar e Adicionar Outro"
                onPress={() => handleSave(true)}
                variant="ghost"
                fullWidth
              />
            </Box>
          </ScrollView>
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
