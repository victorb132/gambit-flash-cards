import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { darkColors } from '@/theme/colors';

interface SpeakingIndicatorProps {
  isVisible: boolean;
}

const BAR_COUNT = 5;
const PHASES = [0, 150, 80, 220, 40];

function Bar({ index, isVisible }: { index: number; isVisible: boolean }) {
  const height = useRef(new Animated.Value(4)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isVisible) {
      const delay = PHASES[index % PHASES.length];
      const maxH = 16 + (index % 3) * 6;
      const duration = 300 + index * 40;

      anim.current = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(height, {
            toValue: maxH,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(height, {
            toValue: 4,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      );
      anim.current.start();
    } else {
      anim.current?.stop();
      Animated.timing(height, {
        toValue: 4,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isVisible]);

  return <Animated.View style={[styles.bar, { height }]} />;
}

export default function SpeakingIndicator({ isVisible }: SpeakingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <Bar key={i} index={i} isVisible={isVisible} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: darkColors.primaryDark,
  },
});
