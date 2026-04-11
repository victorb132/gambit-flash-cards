import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftIcon,
  KeyboardIcon,
  SpeakerSimpleSlashIcon,
  PaperPlaneRightIcon,
} from 'phosphor-react-native';
import { darkColors } from '@/theme/colors';
import { useAuth } from '@/hooks/useAuth';
import { useChatStateMachine } from '@/hooks/useChatStateMachine';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import ChatBubble from '@/components/voice-chat/ChatBubble';
import MicButton from '@/components/voice-chat/MicButton';
import SpeakingIndicator from '@/components/voice-chat/SpeakingIndicator';

export default function VoiceChatScreen() {
  const { user } = useAuth();
  const userName = user?.name ?? 'Usuário';

  const { state, handleUserInput, handleVoiceError, toggleTextInput, isSpeaking, stopTTS } =
    useChatStateMachine(userName);

  const { status: voiceStatus, startRecording, stopRecording } = useVoiceInput(
    handleUserInput,
    handleVoiceError
  );

  const scrollRef = useRef<ScrollView>(null);
  const [textValue, setTextValue] = useState('');

  // Auto-scroll to latest message
  useEffect(() => {
    if (state.messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [state.messages.length]);

  function handleMicPress() {
    if (voiceStatus === 'recording') {
      stopRecording();
    } else if (voiceStatus === 'idle' && !state.isProcessing) {
      startRecording();
    }
  }

  function handleTextSubmit() {
    const text = textValue.trim();
    if (!text) return;
    setTextValue('');
    handleUserInput(text);
  }

  function handleOptionPress(option: string) {
    handleUserInput(option);
  }

  const isInputDisabled =
    state.isProcessing || voiceStatus === 'recording' || voiceStatus === 'processing';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              stopTTS();
              router.back();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.headerBtn}
          >
            <ArrowLeftIcon size={20} color={darkColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Assistente Gambit</Text>
            <View style={styles.headerStatusRow}>
              <View style={[styles.statusDot, isSpeaking && styles.statusDotActive]} />
              <Text style={styles.headerSub}>
                {isSpeaking
                  ? 'falando...'
                  : state.isProcessing
                  ? 'processando...'
                  : voiceStatus === 'recording'
                  ? 'ouvindo...'
                  : 'pronto'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={stopTTS}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.headerBtn}
          >
            <SpeakerSimpleSlashIcon
              size={20}
              color={isSpeaking ? darkColors.primaryDark : darkColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {state.messages.length === 0 && (
            <View style={styles.emptyHint}>
              <ActivityIndicator color={darkColors.textSecondary} />
            </View>
          )}
          {state.messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {state.isProcessing && !isSpeaking && (
            <View style={styles.typingRow}>
              <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={styles.dot} />
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          {/* Speaking wave */}
          {isSpeaking && (
            <View style={styles.speakingRow}>
              <SpeakingIndicator isVisible={isSpeaking} />
            </View>
          )}

          {/* Option buttons */}
          {state.options && !state.isProcessing && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
              style={styles.optionsScroll}
            >
              {state.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleOptionPress(opt)}
                  style={styles.optionBtn}
                  activeOpacity={0.75}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Text input fallback */}
          {state.showTextInput && (
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Digite sua resposta..."
                placeholderTextColor={darkColors.textSecondary}
                value={textValue}
                onChangeText={setTextValue}
                onSubmitEditing={handleTextSubmit}
                returnKeyType="send"
                editable={!isInputDisabled}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleTextSubmit}
                disabled={!textValue.trim() || isInputDisabled}
                style={[styles.sendBtn, (!textValue.trim() || isInputDisabled) && styles.sendBtnDisabled]}
              >
                <PaperPlaneRightIcon
                  size={18}
                  color={!textValue.trim() || isInputDisabled ? darkColors.textSecondary : darkColors.surface}
                  weight="fill"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Mic row */}
          <View style={styles.micRow}>
            <View style={styles.micSide} />
            <MicButton
              status={voiceStatus}
              onPress={handleMicPress}
              disabled={isInputDisabled && voiceStatus === 'idle'}
            />
            <View style={styles.micSide}>
              <TouchableOpacity
                onPress={toggleTextInput}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.keyboardBtn}
              >
                <KeyboardIcon
                  size={20}
                  color={state.showTextInput ? darkColors.primaryDark : darkColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* State hint */}
          <Text style={styles.stateHint}>{getStateHint(state.chatState)}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStateHint(chatState: string): string {
  switch (chatState) {
    case 'GREETING':
      return 'Aguardando...';
    case 'AWAITING_MAIN_OPTION':
      return 'O que você quer fazer?';
    case 'CREATE_DECK__ASK_NAME':
      return 'Diga o nome do novo deck';
    case 'CREATE_DECK__ASK_SUBJECT':
      return 'Diga o assunto dos flashcards';
    case 'ADD_CARD__ASK_DECK':
      return 'Diga o nome do deck';
    case 'ADD_CARD__ASK_SUBJECT':
      return 'Diga o assunto dos flashcards';
    case 'LIST_DECKS':
      return 'Diga qual deck quer estudar';
    case 'DELETE_DECK__ASK_WHICH':
      return 'Diga o nome do deck para excluir';
    case 'DELETE_DECK__CONFIRM':
      return 'Confirme: "sim" ou "não"';
    case 'STUDY__ASK_DECK':
      return 'Diga o nome do deck';
    case 'STUDY__IN_PROGRESS':
      return 'Responda a pergunta do flashcard';
    case 'STUDY__SELF_EVALUATE':
      return 'Acertou, errou ou teve dúvida?';
    case 'STUDY__FINISHED':
      return 'Sessão concluída';
    case 'POST_ACTION__ASK_STUDY':
      return 'Quer estudar agora? Diga "sim" ou "não"';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.surface,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: darkColors.textPrimary,
    letterSpacing: -0.2,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: darkColors.textSecondary,
  },
  statusDotActive: {
    backgroundColor: '#30D158',
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: darkColors.textSecondary,
  },

  // Messages
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },

  // Typing indicator
  typingRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: darkColors.textSecondary,
  },

  // Footer
  footer: {
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
    backgroundColor: darkColors.surface,
  },
  speakingRow: {
    alignItems: 'center',
    paddingTop: 10,
  },

  // Options
  optionsScroll: {
    marginTop: 10,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  optionBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: darkColors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1C1C1C',
  },
  optionText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: darkColors.textPrimary,
  },

  // Text input
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1C1C1C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: darkColors.border,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: darkColors.textPrimary,
    paddingVertical: 8,
    minHeight: 36,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkColors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#2A2A2A',
  },

  // Mic
  micRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  micSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardBtn: {
    padding: 8,
  },

  // State hint
  stateHint: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: darkColors.textSecondary,
    paddingBottom: 4,
  },
});
