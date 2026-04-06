import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '../ui/Box';
import { Theme } from '../../theme';

/** Animated skeleton loader for deck list items */
const DeckSkeleton = React.memo(function DeckSkeleton() {
  const theme = useTheme<Theme>();
  const opacity = useRef(new Animated.Value(0.3)).current;

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

  const skeletonColor = theme.colors.primaryLight;

  return (
    <Animated.View style={{ opacity }}>
      <Box
        backgroundColor="white"
        borderRadius="l"
        padding="m"
        marginBottom="m"
        style={{ elevation: 2 }}
      >
        <Box flexDirection="row" alignItems="center" marginBottom="m">
          <Box
            width={48}
            height={48}
            borderRadius="m"
            style={{ backgroundColor: skeletonColor }}
          />
          <Box marginLeft="m" flex={1}>
            <Box
              height={16}
              borderRadius="s"
              width="60%"
              marginBottom="s"
              style={{ backgroundColor: skeletonColor }}
            />
            <Box
              height={12}
              borderRadius="s"
              width="40%"
              style={{ backgroundColor: skeletonColor }}
            />
          </Box>
        </Box>
        <Box height={8} borderRadius="round" style={{ backgroundColor: skeletonColor }} />
      </Box>
    </Animated.View>
  );
});

export default DeckSkeleton;
