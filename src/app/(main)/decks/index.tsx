import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Sun, Moon, Plus, SignOut, MagnifyingGlass } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '../../../components/ui/Box';
import Text from '../../../components/ui/Text';
import DeckCard from '../../../components/deck/DeckCard';
import DeckSkeleton from '../../../components/common/DeckSkeleton';
import EmptyState from '../../../components/common/EmptyState';
import { useDecks } from '../../../hooks/useDecks';
import { useAuth } from '../../../hooks/useAuth';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { Theme } from '../../../theme';
import { Deck } from '../../../types/deck';

const DEBOUNCE_MS = 300;

export default function DecksScreen() {
  const theme = useTheme<Theme>();
  const { isDark, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();
  const { decks, isLoadingDecks, fetchDecks, removeDecks, filterDecks } = useDecks();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const filteredDecks = useMemo(() => filterDecks(debouncedQuery), [filterDecks, debouncedQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  }, [fetchDecks]);

  function handleDelete(deck: Deck) {
    Alert.alert(
      'Deletar Deck',
      `Tem certeza que deseja deletar "${deck.title}"? Todos os flashcards serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Deletar', style: 'destructive', onPress: () => removeDecks(deck.id) },
      ]
    );
  }

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  const firstName = user?.name.split(' ')[0] ?? 'Usuário';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Box flex={1} backgroundColor="surface">
        {/* Header */}
        <Box padding="m" flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Text variant="caption" color="textSecondary">
              Bem-vindo de volta!
            </Text>
            <Text variant="h2">Olá, {firstName}! 👋</Text>
          </Box>
          <Box flexDirection="row" alignItems="center" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={toggleTheme}
              accessibilityLabel={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isDark ? (
                <Sun size={24} color={theme.colors.textPrimary} />
              ) : (
                <Moon size={24} color={theme.colors.textPrimary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              accessibilityLabel="Sair"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 8 }}
            >
              <SignOut size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </Box>
        </Box>

        {/* Search bar */}
        <Box
          marginHorizontal="m"
          marginBottom="m"
          backgroundColor="surfaceLight"
          borderRadius="m"
          flexDirection="row"
          alignItems="center"
          paddingHorizontal="m"
          borderWidth={1}
          borderColor="border"
        >
          <MagnifyingGlass size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: theme.spacing.m,
              paddingHorizontal: theme.spacing.s,
              fontFamily: 'Poppins_400Regular',
              fontSize: 15,
              color: theme.colors.textPrimary,
            }}
            placeholder="Buscar decks..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Buscar decks"
          />
        </Box>

        {/* Deck list */}
        {isLoadingDecks && decks.length === 0 ? (
          <Box padding="m">
            {[0, 1, 2].map((i) => (
              <DeckSkeleton key={i} />
            ))}
          </Box>
        ) : (
          <FlatList
            data={filteredDecks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.m,
              paddingBottom: 100,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primaryDark}
              />
            }
            renderItem={({ item }) => (
              <DeckCard
                deck={item}
                onPress={() => router.push(`/(main)/decks/${item.id}`)}
                onDelete={() => handleDelete(item)}
              />
            )}
            ListEmptyComponent={
              debouncedQuery ? (
                <EmptyState
                  emoji="🔍"
                  title="Nenhum deck encontrado"
                  description={`Não encontramos decks para "${debouncedQuery}".`}
                />
              ) : (
                <EmptyState
                  emoji="📚"
                  title="Nenhum deck ainda"
                  description="Crie seu primeiro deck e comece a estudar!"
                  actionLabel="Criar Deck"
                  onAction={() => router.push('/(main)/create-deck')}
                />
              )
            }
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          onPress={() => router.push('/(main)/create-deck')}
          accessibilityLabel="Criar novo deck"
          style={{
            position: 'absolute',
            bottom: 32,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.primaryDark,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Plus size={28} color={theme.colors.white} weight="bold" />
        </TouchableOpacity>
      </Box>
    </SafeAreaView>
  );
}
