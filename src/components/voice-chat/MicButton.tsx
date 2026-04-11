import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native';
import { MicrophoneIcon, StopIcon } from 'phosphor-react-native';
import { darkColors } from '@/theme/colors';
// 'processing' comes from the state machine, not from VoiceStatus directly
type MicStatus = 'idle' | 'recording' | 'processing';

interface MicButtonProps {
  status: MicStatus;
  onPress: () => void;
  disabled?: boolean;
}

const BUTTON_SIZE = 72;
const RIPPLE_SIZE = BUTTON_SIZE + 24;

export default function MicButton({ status, onPress, disabled }: MicButtonProps) {
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (status === 'recording') {
      Animated.timing(rippleOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();

      rippleScale.setValue(1);
      rippleAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleScale, {
            toValue: 1.5,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rippleScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      rippleAnim.current.start();
    } else {
      rippleAnim.current?.stop();
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [status]);

  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';

  const buttonBg = isRecording
    ? '#FF3B30'
    : isProcessing
    ? '#333333'
    : darkColors.primaryDark;

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.ripple,
          { backgroundColor: isRecording ? '#FF3B30' : darkColors.primaryDark },
          { transform: [{ scale: rippleScale }], opacity: rippleOpacity },
        ]}
        pointerEvents="none"
      />

      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isProcessing}
        activeOpacity={0.85}
        style={[styles.button, { backgroundColor: buttonBg }]}
        accessibilityLabel={
          isRecording ? 'Parar gravação' : isProcessing ? 'Processando' : 'Gravar voz'
        }
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={darkColors.surface} />
        ) : isRecording ? (
          <StopIcon size={30} color={darkColors.surfaceLight} weight="fill" />
        ) : (
          <MicrophoneIcon size={30} color={darkColors.surface} weight="fill" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
