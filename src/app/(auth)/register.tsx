import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Envelope, Lock, ArrowLeft, Brain, Trophy, Lightbulb, Code, MusicNote } from 'phosphor-react-native';
import Text from '../../components/ui/Text';
import { useAuth } from '../../hooks/useAuth';
import { Theme } from '../../theme';

const FLOATING_ICONS = [
  { Icon: Brain,     top: '6%',  left: '8%',   size: 34, opacity: 0.18, rotate: '-15deg' },
  { Icon: Trophy,    top: '4%',  right: '12%', size: 26, opacity: 0.14, rotate: '12deg'  },
  { Icon: Lightbulb, top: '18%', left: '26%',  size: 20, opacity: 0.12, rotate: '0deg'   },
  { Icon: Code,      top: '14%', right: '28%', size: 28, opacity: 0.15, rotate: '-8deg'  },
  { Icon: MusicNote, top: '26%', left: '5%',   size: 22, opacity: 0.12, rotate: '18deg'  },
];

export default function RegisterScreen() {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { isSubmitting, errors, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleRegister() {
    const success = await register(name, email, password);
    if (success) router.replace('/(main)/decks');
  }

  const inputStyle = {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: theme.colors.textPrimary,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.primaryDark }]}>
        <View style={[styles.upperSection, { paddingTop: insets.top + 16 }]}>
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

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={theme.colors.surfaceLight} weight="bold" />
          </TouchableOpacity>

          <View style={styles.upperContent}>
            <Text style={{ fontSize: 28, fontFamily: 'Poppins_700Bold', color: theme.colors.surfaceLight }}>
              Criar conta
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: theme.colors.surface, marginTop: 6, opacity: 0.85 }}>
              Comece a estudar gratuitamente
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
                paddingBottom: insets.bottom + 32,
              },
            ]}
          >
            <View style={styles.fieldGroup}>
              <Text style={labelStyle(theme)}>Nome</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconLeft}>
                  <User size={18} color={theme.colors.textSecondary} />
                </View>
                <TextInput
                  style={[inputStyle, { paddingLeft: 44 }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome completo"
                  placeholderTextColor={theme.colors.textSecondary}
                  autoComplete="name"
                  returnKeyType="next"
                />
              </View>
              {errors.name && <Text style={errorTextStyle(theme)}>{errors.name}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={labelStyle(theme)}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconLeft}>
                  <Envelope size={18} color={theme.colors.textSecondary} />
                </View>
                <TextInput
                  style={[inputStyle, { paddingLeft: 44 }]}
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
                  <Lock size={18} color={theme.colors.textSecondary} />
                </View>
                <TextInput
                  style={[inputStyle, { paddingLeft: 44 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>
              {errors.password && <Text style={errorTextStyle(theme)}>{errors.password}</Text>}
            </View>

            {errors.general && (
              <View style={[styles.errorBox, { backgroundColor: theme.colors.error }]}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins_400Regular', color: theme.colors.white, textAlign: 'center' }}>
                  {errors.general}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: isSubmitting ? theme.colors.primary : theme.colors.primaryDark },
              ]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: theme.colors.surfaceLight }}>
                {isSubmitting ? 'Criando conta...' : 'Criar conta'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  upperSection: {
    height: 210,
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  fieldGroup: { marginBottom: 20 },
  inputWrapper: { position: 'relative' },
  iconLeft: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  errorBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  submitButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});

function labelStyle(theme: Theme) {
  return {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  };
}

function errorTextStyle(theme: Theme) {
  return {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: theme.colors.error,
    marginTop: 4,
  };
}
