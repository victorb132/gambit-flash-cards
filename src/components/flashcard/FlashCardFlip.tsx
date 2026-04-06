import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { SpeakerHigh } from 'phosphor-react-native';
import Box from '../ui/Box';
import Text from '../ui/Text';
import { FlashCard } from '../../types/flashcard';
import { Theme } from '../../theme';

interface FlashCardFlipProps {
  card: FlashCard;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: (text: string) => void;
}

const FlashCardFlip = React.memo(function FlashCardFlip({
  card,
  isFlipped,
  onFlip,
  onSpeak,
}: FlashCardFlipProps) {
  const theme = useTheme<Theme>();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isFlipped ? 180 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, rotation]);

  const frontRotateY = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotateY = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontStyle = {
    transform: [{ perspective: 1000 }, { rotateY: frontRotateY }],
    backfaceVisibility: 'hidden' as const,
    position: 'absolute' as const,
    width: '100%' as const,
    height: '100%' as const,
  };

  const backStyle = {
    transform: [{ perspective: 1000 }, { rotateY: backRotateY }],
    backfaceVisibility: 'hidden' as const,
    position: 'absolute' as const,
    width: '100%' as const,
    height: '100%' as const,
  };

  const cardShadow =
    Platform.OS === 'ios'
      ? {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        }
      : { elevation: 6 };

  function CardFace({ text, label, bgColor }: { text: string; label: string; bgColor: string }) {
    return (
      <Box
        flex={1}
        borderRadius="xl"
        padding="xl"
        alignItems="center"
        justifyContent="center"
        style={[{ backgroundColor: bgColor }, cardShadow]}
      >
        <Text
          variant="caption"
          color="textSecondary"
          marginBottom="m"
          style={{ textTransform: 'uppercase', letterSpacing: 2 }}
        >
          {label}
        </Text>
        <Text variant="h2" textAlign="center" color="textPrimary" style={{ lineHeight: 36 }}>
          {text}
        </Text>
        <TouchableOpacity
          onPress={() => onSpeak(text)}
          style={{ position: 'absolute', top: 16, right: 16 }}
          accessibilityLabel={`Ouvir ${label}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SpeakerHigh size={24} color={theme.colors.primary} weight="fill" />
        </TouchableOpacity>
      </Box>
    );
  }

  return (
    <TouchableOpacity
      onPress={onFlip}
      activeOpacity={1}
      style={{ flex: 1 }}
      accessibilityLabel={isFlipped ? 'Toque para voltar à pergunta' : 'Toque para ver a resposta'}
      accessibilityHint="Toque no card para virar"
    >
      <Box flex={1} style={{ position: 'relative' }}>
        <Animated.View style={frontStyle}>
          <CardFace text={card.question} label="Pergunta" bgColor={theme.colors.white} />
        </Animated.View>
        <Animated.View style={backStyle}>
          <CardFace text={card.answer} label="Resposta" bgColor={theme.colors.surfaceLight} />
        </Animated.View>
      </Box>
    </TouchableOpacity>
  );
});

export default FlashCardFlip;
