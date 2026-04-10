import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '@/components/ui/Box';
import { Theme } from '@/theme';

function CardRowSkeleton({ opacity, color }: { opacity: Animated.Value; color: string }) {
  return (
    <Animated.View style={{ opacity }}>
      <Box
        backgroundColor="white"
        borderRadius="m"
        padding="m"
        marginBottom="s"
        flexDirection="row"
        alignItems="center"
        borderWidth={1}
        borderColor="border"
      >
        <Box width={28} height={12} borderRadius="s" marginRight="m" style={{ backgroundColor: color }} />
        <Box flex={1}>
          <Box height={12} borderRadius="s" width="75%" marginBottom="xs" style={{ backgroundColor: color }} />
          <Box height={10} borderRadius="s" width="45%" style={{ backgroundColor: color }} />
        </Box>
        <Box width={18} height={18} borderRadius="round" style={{ backgroundColor: color }} />
      </Box>
    </Animated.View>
  );
}

const FlashcardListSkeleton = React.memo(function FlashcardListSkeleton() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Box flex={1} backgroundColor="surface">
        {/* Header */}
        <Animated.View style={{ opacity }}>
          <Box
            flexDirection="row"
            alignItems="center"
            padding="m"
            borderBottomWidth={1}
            borderColor="border"
          >
            <Box width={24} height={24} borderRadius="s" style={{ backgroundColor: color }} />
            <Box marginLeft="m" flex={1}>
              <Box height={16} borderRadius="s" width="45%" style={{ backgroundColor: color }} />
            </Box>
          </Box>
        </Animated.View>

        {/* Progress card */}
        <Animated.View style={{ opacity }}>
          <Box
            backgroundColor="white"
            margin="m"
            borderRadius="l"
            padding="m"
            style={{ elevation: 3 }}
          >
            <Box flexDirection="row" justifyContent="space-between" marginBottom="m">
              <Box height={12} borderRadius="s" width="38%" style={{ backgroundColor: color }} />
              <Box height={12} borderRadius="s" width="22%" style={{ backgroundColor: color }} />
            </Box>
            <Box height={10} borderRadius="round" style={{ backgroundColor: color }} marginBottom="m" />
            <Box flexDirection="row" justifyContent="space-around">
              {[0, 1, 2].map((i) => (
                <Box key={i} alignItems="center">
                  <Box width={32} height={24} borderRadius="s" marginBottom="xs" style={{ backgroundColor: color }} />
                  <Box width={44} height={10} borderRadius="s" style={{ backgroundColor: color }} />
                </Box>
              ))}
            </Box>
          </Box>
        </Animated.View>

        {/* Card rows */}
        <Box paddingHorizontal="m">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <CardRowSkeleton key={i} opacity={opacity} color={color} />
          ))}
        </Box>
      </Box>
    </SafeAreaView>
  );
});

export default FlashcardListSkeleton;
