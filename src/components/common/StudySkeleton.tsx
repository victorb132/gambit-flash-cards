import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '@/components/ui/Box';
import { Theme } from '@/theme';

const StudySkeleton = React.memo(function StudySkeleton() {
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
      <Animated.View style={{ opacity, flex: 1 }}>
        <Box flex={1} backgroundColor="surface">
          {/* Header */}
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            padding="m"
          >
            <Box width={24} height={24} borderRadius="s" style={{ backgroundColor: color }} />
            <Box alignItems="center">
              <Box height={14} width={48} borderRadius="s" marginBottom="xs" style={{ backgroundColor: color }} />
              <Box height={10} width={80} borderRadius="s" style={{ backgroundColor: color }} />
            </Box>
            <Box width={24} height={24} borderRadius="s" style={{ backgroundColor: color }} />
          </Box>

          {/* Progress bar */}
          <Box paddingHorizontal="m" marginBottom="m">
            <Box height={6} borderRadius="round" style={{ backgroundColor: color }} />
          </Box>

          {/* Card */}
          <Box flex={1} padding="m">
            <Box flex={1} borderRadius="xl" style={{ backgroundColor: color }} />
          </Box>
        </Box>
      </Animated.View>
    </SafeAreaView>
  );
});

export default StudySkeleton;
