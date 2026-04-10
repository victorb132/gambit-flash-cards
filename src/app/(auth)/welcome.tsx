import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Books,
  Globe,
  Atom,
  Brain,
  Flask,
  MusicNote,
  Palette,
  Trophy,
  Code,
  Lightbulb,
} from 'phosphor-react-native';
import Text from '@/components/ui/Text';
import { Theme } from '@/theme';

const FLOATING_ICONS = [
  { Icon: Books,     top: '8%',  left: '6%',   size: 36, opacity: 0.12, rotate: '-15deg', speed: 2400 },
  { Icon: Globe,     top: '5%',  right: '10%', size: 28, opacity: 0.10, rotate: '12deg',  speed: 3100 },
  { Icon: Atom,      top: '20%', left: '22%',  size: 20, opacity: 0.08, rotate: '0deg',   speed: 2700 },
  { Icon: Brain,     top: '15%', right: '28%', size: 32, opacity: 0.11, rotate: '-8deg',  speed: 2200 },
  { Icon: Flask,     top: '30%', left: '4%',   size: 24, opacity: 0.09, rotate: '20deg',  speed: 3400 },
  { Icon: MusicNote, top: '24%', right: '5%',  size: 26, opacity: 0.10, rotate: '-18deg', speed: 2600 },
  { Icon: Palette,   top: '40%', left: '14%',  size: 18, opacity: 0.07, rotate: '10deg',  speed: 2900 },
  { Icon: Trophy,    top: '36%', right: '12%', size: 22, opacity: 0.09, rotate: '-5deg',  speed: 3200 },
  { Icon: Code,      top: '50%', left: '3%',   size: 18, opacity: 0.07, rotate: '15deg',  speed: 2500 },
  { Icon: Lightbulb, top: '46%', right: '3%',  size: 20, opacity: 0.08, rotate: '-12deg', speed: 3000 },
];

export default function WelcomeScreen() {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();

  const floatAnims = useRef(FLOATING_ICONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    floatAnims.forEach((anim, i) => {
      const delay = i * 180;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: FLOATING_ICONS[i].speed,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: FLOATING_ICONS[i].speed,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Decorative top strip */}
      <View style={[styles.topStrip, { backgroundColor: theme.colors.primaryDark }]} />

      {/* Floating icons */}
      {FLOATING_ICONS.map(({ Icon, top, left, right, size, opacity, rotate }, i) => {
        const translateY = floatAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.floatingIcon,
              {
                top: top as any,
                left: left as any,
                right: right as any,
                opacity,
                transform: [{ rotate }, { translateY }],
              },
            ]}
          >
            <Icon size={size} color={theme.colors.primaryDark} weight="thin" />
          </Animated.View>
        );
      })}

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 48 }]}>
        <View style={styles.titleArea}>
          <View style={[styles.badge, { borderColor: theme.colors.border }]}>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Poppins_600SemiBold',
                color: theme.colors.textSecondary,
                letterSpacing: 2.5,
              }}
            >
              FLASHCARDS
            </Text>
          </View>
          <Text
            style={{
              fontSize: 46,
              fontFamily: 'Poppins_700Bold',
              color: theme.colors.textPrimary,
              textAlign: 'center',
              lineHeight: 52,
              letterSpacing: -1.5,
              marginTop: 14,
            }}
          >
            GAMBIT
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_400Regular',
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 10,
              letterSpacing: 0.3,
            }}
          >
            Domine qualquer assunto,{'\n'}uma carta por vez.
          </Text>
        </View>
      </View>

      {/* Bottom section */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: theme.colors.surfaceLight,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + 28,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primaryDark }]}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.82}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_600SemiBold',
              color: theme.colors.surfaceLight,
              textAlign: 'center',
              letterSpacing: 0.4,
            }}
          >
            Entrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineButton, { borderColor: theme.colors.border }]}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.82}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_600SemiBold',
              color: theme.colors.textPrimary,
              textAlign: 'center',
              letterSpacing: 0.4,
            }}
          >
            Criar conta
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  floatingIcon: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  titleArea: {
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bottomCard: {
    borderTopWidth: 1,
    paddingTop: 28,
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryButton: {
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
