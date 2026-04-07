import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '../ui/Box';
import { Theme } from '../../theme';

/** Generic skeleton loading overlay */
const LoadingState = React.memo(function LoadingState() {
  const theme = useTheme<Theme>();
  const opacity = useRef(new Animated.Value(0.3)).current;
  const color = theme.colors.border;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Box flex={1} backgroundColor="surface" padding="l">
      <Animated.View style={{ opacity }}>
        <Box height={24} borderRadius="m" width="55%" marginBottom="xl" style={{ backgroundColor: color }} />
        <Box backgroundColor="white" borderRadius="l" padding="m" marginBottom="m" style={{ elevation: 2 }}>
          <Box height={16} borderRadius="s" width="70%" marginBottom="m" style={{ backgroundColor: color }} />
          <Box height={12} borderRadius="s" width="90%" marginBottom="s" style={{ backgroundColor: color }} />
          <Box height={12} borderRadius="s" width="60%" style={{ backgroundColor: color }} />
        </Box>
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} backgroundColor="white" borderRadius="m" padding="m" marginBottom="s" style={{ elevation: 1 }}>
            <Box height={12} borderRadius="s" width={`${65 + i * 8}%`} style={{ backgroundColor: color }} />
          </Box>
        ))}
      </Animated.View>
    </Box>
  );
});

export default LoadingState;
