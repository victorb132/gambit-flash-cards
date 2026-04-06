import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppThemeProvider } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import LoadingState from '@/components/common/LoadingState';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadPersistedAuth } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    loadPersistedAuth();
  }, [loadPersistedAuth]);

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      if (isAuthenticated) {
        router.replace('/(main)/decks');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
        {(!fontsLoaded || isLoading) && (
          <View style={StyleSheet.absoluteFill}>
            <LoadingState message="Carregando..." />
          </View>
        )}
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
