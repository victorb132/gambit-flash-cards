import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Envelope, Lock } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '../../components/ui/Box';
import Text from '../../components/ui/Text';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { Theme } from '../../theme';

export default function LoginScreen() {
  const theme = useTheme<Theme>();
  const { isSubmitting, errors, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    const success = await login(email, password);
    if (success) {
      router.replace('/(main)/decks');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative top accent */}
          <Box
            height={180}
            backgroundColor="primaryDark"
            alignItems="center"
            justifyContent="flex-end"
            paddingBottom="l"
            style={{ borderBottomLeftRadius: 48, borderBottomRightRadius: 48 }}
          />

          <Box flex={1} padding="xl" style={{ marginTop: -48 }}>
            {/* Logo card */}
            <Box
              backgroundColor="white"
              borderRadius="xl"
              padding="l"
              alignItems="center"
              marginBottom="xl"
              style={{
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <Text style={{ fontSize: 56 }}>🃏</Text>
              <Text variant="h2" marginTop="s" color="primaryDark" textAlign="center">
                Gambit Flash Cards
              </Text>
              <Text variant="bodySmall" textAlign="center" marginTop="xs" color="textSecondary">
                Domine qualquer assunto, uma carta por vez.
              </Text>
            </Box>

            {/* Form */}
            <Box>
              <Input
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                leftIcon={<Envelope size={20} color={theme.colors.textSecondary} />}
                returnKeyType="next"
              />

              <Input
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                isPassword
                error={errors.password}
                leftIcon={<Lock size={20} color={theme.colors.textSecondary} />}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              {errors.general && (
                <Box
                  backgroundColor="error"
                  borderRadius="m"
                  padding="m"
                  marginBottom="m"
                  style={{ opacity: 0.9 }}
                >
                  <Text variant="bodySmall" color="white" textAlign="center">
                    {errors.general}
                  </Text>
                </Box>
              )}

              <Box marginTop="s">
                <Button label="Entrar" onPress={handleLogin} isLoading={isSubmitting} fullWidth />
              </Box>

              <Text variant="caption" textAlign="center" color="textSecondary" marginTop="xl">
                Demo: usuario@gambit.com / 123456
              </Text>
            </Box>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
