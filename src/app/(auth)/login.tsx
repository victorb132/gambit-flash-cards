import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Envelope, Lock, ArrowLeft, Books, Globe, Atom, Brain, Flask } from 'phosphor-react-native';
import Text from '../../components/ui/Text';
import { useAuth } from '../../hooks/useAuth';
import { Theme } from '../../theme';

const FLOATING_ICONS = [
  { Icon: Books, top: '6%',  left: '6%',   size: 32, opacity: 0.10, rotate: '-15deg', speed: 2400 },
  { Icon: Globe, top: '4%',  right: '10%', size: 24, opacity: 0.08, rotate: '12deg',  speed: 3100 },
  { Icon: Atom,  top: '18%', left: '24%',  size: 18, opacity: 0.07, rotate: '0deg',   speed: 2700 },
  { Icon: Brain, top: '14%', right: '26%', size: 28, opacity: 0.09, rotate: '-8deg',  speed: 2200 },
  { Icon: Flask, top: '26%', left: '4%',   size: 22, opacity: 0.08, rotate: '20deg',  speed: 3400 },
];

export default function LoginScreen() {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { isSubmitting, errors, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const floatAnims = useRef(FLOATING_ICONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    floatAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: FLOATING_ICONS[i].speed,
            delay: i * 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: FLOATING_ICONS[i].speed,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  async function handleLogin() {
    const success = await login(email, password);
    if (success) router.replace('/(main)/decks');
  }

  const inputStyle = {
    height: 46,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: theme.colors.textPrimary,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        {/* Top strip */}
        <View style={[styles.topStrip, { backgroundColor: theme.colors.primaryDark }]} />

        <View style={[styles.upperSection, { paddingTop: insets.top + 16 }]}>
          {FLOATING_ICONS.map(({ Icon, top, left, right, size, opacity, rotate }, i) => {
            const translateY = floatAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10],
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

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} weight="bold" />
          </TouchableOpacity>

          <View style={styles.upperContent}>
            <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 2.5 }}>
              BEM-VINDO DE VOLTA
            </Text>
            <Text style={{ fontSize: 26, fontFamily: 'Poppins_700Bold', color: theme.colors.textPrimary, letterSpacing: -0.5, marginTop: 4 }}>
              Entrar
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surfaceLight,
                borderTopColor: theme.colors.border,
                paddingBottom: insets.bottom + 32,
              },
            ]}
          >
            <View style={styles.fieldGroup}>
              <Text style={labelStyle(theme)}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconLeft}>
                  <Envelope size={16} color={theme.colors.textSecondary} />
                </View>
                <TextInput
                  style={[inputStyle, { paddingLeft: 40 }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
              {errors.email && <Text style={errorTextStyle(theme)}>{errors.email}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={labelStyle(theme)}>Senha</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconLeft}>
                  <Lock size={16} color={theme.colors.textSecondary} />
                </View>
                <TextInput
                  style={[inputStyle, { paddingLeft: 40 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>
              {errors.password && <Text style={errorTextStyle(theme)}>{errors.password}</Text>}
            </View>

            {errors.general && (
              <View style={[styles.errorBox, { backgroundColor: theme.colors.error + '18', borderColor: theme.colors.error, borderWidth: 1 }]}>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins_400Regular', color: theme.colors.error, textAlign: 'center' }}>
                  {errors.general}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primaryDark },
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.82}
            >
              <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: theme.colors.surfaceLight, letterSpacing: 0.4 }}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20, letterSpacing: 0.2 }}>
              Demo: usuario@gambit.com / 123456
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  upperSection: {
    height: 200,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  floatingIcon: { position: 'absolute' },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
  },
  upperContent: { marginTop: 8 },
  card: {
    flex: 1,
    borderTopWidth: 1,
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  fieldGroup: { marginBottom: 18 },
  inputWrapper: { position: 'relative' },
  iconLeft: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  errorBox: {
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  submitButton: {
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});

function labelStyle(theme: Theme) {
  return {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: theme.colors.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  };
}

function errorTextStyle(theme: Theme) {
  return {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: theme.colors.error,
    marginTop: 4,
  };
}
