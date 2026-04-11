import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkColors } from '@/theme/colors';
import { ChatMessage } from '@/hooks/useChatStateMachine';

interface ChatBubbleProps {
  message: ChatMessage;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <View style={[styles.row, isAssistant ? styles.rowLeft : styles.rowRight]}>
      {isAssistant && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>G</Text>
        </View>
      )}
      <View style={[styles.bubble, isAssistant ? styles.bubbleAssistant : styles.bubbleUser]}>
        <Text style={[styles.text, isAssistant ? styles.textAssistant : styles.textUser]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isAssistant ? styles.timeAssistant : styles.timeUser]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: darkColors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: darkColors.surface,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bubbleAssistant: {
    backgroundColor: '#1C1C1C',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: darkColors.primaryDark,
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  textAssistant: {
    color: darkColors.textPrimary,
  },
  textUser: {
    color: darkColors.surface,
  },
  time: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeAssistant: {
    color: darkColors.primaryLight,
  },
  timeUser: {
    color: darkColors.surface + 'AA',
  },
});
