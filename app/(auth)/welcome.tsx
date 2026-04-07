import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
  { Icon: Books,     top: '8%',  left: '6%',   size: 38, opacity: 0.18, rotate: '-15deg' },
  { Icon: Globe,     top: '5%',  right: '10%', size: 30, opacity: 0.14, rotate: '12deg'  },
  { Icon: Atom,      top: '18%', left: '22%',  size: 22, opacity: 0.12, rotate: '0deg'   },
  { Icon: Brain,     top: '14%', right: '28%', size: 34, opacity: 0.16, rotate: '-8deg'  },
  { Icon: Flask,     top: '28%', left: '4%',   size: 26, opacity: 0.13, rotate: '20deg'  },
  { Icon: MusicNote, top: '22%', right: '5%',  size: 28, opacity: 0.15, rotate: '-18deg' },
  { Icon: Palette,   top: '38%', left: '14%',  size: 20, opacity: 0.10, rotate: '10deg'  },
  { Icon: Trophy,    top: '35%', right: '12%', size: 24, opacity: 0.12, rotate: '-5deg'  },
  { Icon: Code,      top: '48%', left: '3%',   size: 20, opacity: 0.10, rotate: '15deg'  },
  { Icon: Lightbulb, top: '44%', right: '3%',  size: 22, opacity: 0.11, rotate: '-12deg' },
];

export default function WelcomeScreen() {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primaryDark }]}>
      {/* Floating icons */}
      {FLOATING_ICONS.map(({ Icon, top, left, right, size, opacity, rotate }, i) => (
        <View
          key={i}
          style={[
            styles.floatingIcon,
            { top: top as any, left: left as any, right: right as any,
              opacity, transform: [{ rotate }] },
          ]}
        >
          <Icon size={size} color={theme.colors.surfaceLight} weight="fill" />
        </View>
      ))}

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 48 }]}>
        {/* App name */}
        <View style={styles.titleArea}>
          <Text
            style={{
              fontSize: 42,
              fontFamily: 'Poppins_700Bold',
              color: theme.colors.surfaceLight,
              textAlign: 'center',
              lineHeight: 50,
            }}
          >
            Gambit{'\n'}Flash Cards
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Poppins_400Regular',
              color: theme.colors.surface,
              textAlign: 'center',
              marginTop: 12,
              opacity: 0.85,
            }}
          >
            Domine qualquer assunto,{'\n'}uma carta por vez.
          </Text>
        </View>
      </View>

      {/* Bottom card with buttons */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: theme.colors.surfaceLight,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primaryDark }]}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Poppins_600SemiBold',
              color: theme.colors.surfaceLight,
              textAlign: 'center',
            }}
          >
            Entrar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineButton, { borderColor: theme.colors.primaryDark }]}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Poppins_600SemiBold',
              color: theme.colors.primaryDark,
              textAlign: 'center',
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
  bottomCard: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 36,
    paddingHorizontal: 28,
    gap: 14,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
