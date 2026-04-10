import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { Theme } from '@/theme';

interface VoiceIndicatorProps {
  isListening: boolean;
}

/** Animated sound wave indicator shown when voice recognition is active */
const VoiceIndicator = React.memo(function VoiceIndicator({ isListening }: VoiceIndicatorProps) {
  const theme = useTheme<Theme>();
  const waves = [useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.4)).current];

  useEffect(() => {
    if (!isListening) {
      waves.forEach((w) => w.setValue(0.4));
      return;
    }
    const animations = waves.map((w, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(w, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(w, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="center" padding="s">
      {waves.map((w, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            height: 24,
            borderRadius: 2,
            backgroundColor: isListening ? theme.colors.primary : theme.colors.border,
            marginHorizontal: 3,
            transform: [{ scaleY: w }],
          }}
        />
      ))}
      <Text
        variant="caption"
        color={isListening ? 'primary' : 'textSecondary'}
        marginLeft="s"
      >
        {isListening ? 'Ouvindo...' : 'Voz desativada'}
      </Text>
    </Box>
  );
});

export default VoiceIndicator;
