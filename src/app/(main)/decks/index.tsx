import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "@shopify/restyle";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  GearIcon,
  ArrowsDownUpIcon,
} from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import DeckCard from '@/components/deck/DeckCard';
import DeckSkeleton from '@/components/common/DeckSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useDecks } from '@/hooks/useDecks';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/theme/ThemeProvider';
import { useStatsStore } from '@/stores/statsStore';
import { Theme } from '@/theme';
import { Deck } from '@/types/deck';

const DEBOUNCE_MS = 300;

export default function DecksScreen() {
  const theme = useTheme<Theme>();
  const { isDark, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();
  const {
    decks,
    isLoadingDecks,
    error: decksError,
    fetchDecks,
    removeDecks,
    filterDecks,
  } = useDecks();
  const { streak, loadStats, isLoaded } = useStatsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<
    "default" | "name" | "due" | "recent"
  >("default");

  const SORT_CYCLE: Array<"default" | "name" | "due" | "recent"> = [
    "default",
    "name",
    "due",
    "recent",
  ];
  const SORT_LABELS: Record<string, string> = {
    default: "Padrão",
    name: "Nome",
    due: "Pendentes",
    recent: "Recentes",
  };

  function cycleSortMode() {
    setSortMode((cur) => {
      const idx = SORT_CYCLE.indexOf(cur);
      return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
    });
  }
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const fabPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchDecks();
    if (!isLoaded) loadStats();
  }, [fetchDecks, loadStats, isLoaded]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(fabPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setDebouncedQuery(searchQuery),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const filteredDecks = useMemo(() => {
    const base = filterDecks(debouncedQuery);
    if (sortMode === "name")
      return [...base].sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === "due")
      return [...base].sort(
        (a, b) => (b.progress.dueCount ?? 0) - (a.progress.dueCount ?? 0),
      );
    if (sortMode === "recent")
      return [...base].sort((a, b) => {
        const ta = a.lastStudiedAt ?? a.createdAt;
        const tb = b.lastStudiedAt ?? b.createdAt;
        return tb.localeCompare(ta);
      });
    return base;
  }, [filterDecks, debouncedQuery, sortMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  }, [fetchDecks]);

  function handleDelete(deck: Deck) {
    Alert.alert(
      "Deletar Deck",
      `Tem certeza que deseja deletar "${deck.title}"? Todos os flashcards serão perdidos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: () => removeDecks(deck.id),
        },
      ],
    );
  }

  function handleLogout() {
    Alert.alert("Sair", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  }

  const firstName = user?.name.split(" ")[0] ?? "Usuário";
  const totalDue = filteredDecks.reduce(
    (sum, d) => sum + (d.progress.dueCount ?? 0),
    0,
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Box flex={1} backgroundColor="surface">
        {/* Header */}
        <Box
          padding="m"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Box>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Poppins_600SemiBold",
                color: theme.colors.textSecondary,
                letterSpacing: 2,
              }}
            >
              GAMBIT
            </Text>
            <Box flexDirection="row" alignItems="center" style={{ gap: 10 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Poppins_700Bold",
                  color: theme.colors.textPrimary,
                  letterSpacing: -0.3,
                }}
              >
                Olá, {firstName}
              </Text>
              {streak > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.warning + "22",
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: theme.colors.warning + "44",
                    gap: 3,
                  }}
                >
                  <Text style={{ fontSize: 11 }}>🔥</Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Poppins_600SemiBold",
                      color: theme.colors.warning,
                    }}
                  >
                    {streak}
                  </Text>
                </View>
              )}
            </Box>
          </Box>
          <Box flexDirection="row" alignItems="center" style={{ gap: 16 }}>
            <TouchableOpacity
              onPress={() => router.push("/(main)/stats")}
              accessibilityLabel="Estatísticas"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChartBarIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(main)/settings")}
              accessibilityLabel="Configurações"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <GearIcon size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </Box>
        </Box>

        {/* Due cards banner */}
        {totalDue > 0 && !debouncedQuery && (
          <TouchableOpacity
            onPress={() => {
              const first = decks.find((d) => (d.progress.dueCount ?? 0) > 0);
              if (first) router.push(`/(main)/decks/${first.id}/study`);
            }}
            activeOpacity={0.82}
          >
            <Box
              style={{
                backgroundColor: theme.colors.primaryDark,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Poppins_600SemiBold",
                  color: theme.colors.surfaceLight,
                  letterSpacing: 0.3,
                }}
              >
                {totalDue}{" "}
                {totalDue === 1
                  ? "card para revisar hoje"
                  : "cards para revisar hoje"}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Poppins_600SemiBold",
                  color: theme.colors.surfaceLight,
                  opacity: 0.6,
                  letterSpacing: 1,
                }}
              >
                SRS ↑
              </Text>
            </Box>
          </TouchableOpacity>
        )}

        {/* Search bar + sort */}
        <Box
          flexDirection="row"
          alignItems="center"
          marginHorizontal="m"
          marginTop="m"
          marginBottom="s"
          style={{ gap: 8 }}
        >
          <Box
            flex={1}
            flexDirection="row"
            alignItems="center"
            backgroundColor="surfaceLight"
            borderRadius="s"
            paddingHorizontal="m"
            style={{ borderWidth: 1, borderColor: theme.colors.border }}
          >
            <MagnifyingGlassIcon size={16} color={theme.colors.textSecondary} />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: theme.spacing.s,
                fontFamily: "Poppins_400Regular",
                fontSize: 13,
                color: theme.colors.textPrimary,
              }}
              placeholder="Buscar decks..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Buscar decks"
            />
          </Box>
          <TouchableOpacity
            onPress={cycleSortMode}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Box
              backgroundColor="surfaceLight"
              borderRadius="s"
              paddingHorizontal="s"
              alignItems="center"
              justifyContent="center"
              style={{
                borderWidth: 1,
                borderColor:
                  sortMode !== "default"
                    ? theme.colors.primaryDark
                    : theme.colors.border,
                height: 38,
                minWidth: 38,
                gap: 2,
              }}
            >
              <ArrowsDownUpIcon
                size={14}
                color={
                  sortMode !== "default"
                    ? theme.colors.primaryDark
                    : theme.colors.textSecondary
                }
              />
              {sortMode !== "default" && (
                <Text
                  style={{
                    fontSize: 7,
                    fontFamily: "Poppins_600SemiBold",
                    color: theme.colors.primaryDark,
                    letterSpacing: 0.5,
                  }}
                >
                  {SORT_LABELS[sortMode]}
                </Text>
              )}
            </Box>
          </TouchableOpacity>
        </Box>

        {/* Error banner */}
        {decksError && !isLoadingDecks && (
          <TouchableOpacity onPress={fetchDecks} activeOpacity={0.8}>
            <Box
              style={{
                backgroundColor: theme.colors.error + "15",
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.error + "33",
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Poppins_500Medium",
                  color: theme.colors.error,
                  flex: 1,
                }}
              >
                {decksError}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Poppins_600SemiBold",
                  color: theme.colors.error,
                  opacity: 0.7,
                }}
              >
                Tentar novamente
              </Text>
            </Box>
          </TouchableOpacity>
        )}

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
              paddingTop: theme.spacing.s,
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
                  onAction={() => router.push("/(main)/create-deck")}
                />
              )
            }
          />
        )}

        {/* FAB with pulse */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 32,
            right: 24,
            transform: [{ scale: fabPulse }],
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(main)/create-deck")}
            accessibilityLabel="Criar novo deck"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.colors.primaryDark,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <PlusIcon
              size={22}
              color={theme.colors.surfaceLight}
              weight="bold"
            />
          </TouchableOpacity>
        </Animated.View>
      </Box>
    </SafeAreaView>
  );
}
