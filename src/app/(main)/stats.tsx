import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { ArrowLeft } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { useStatsStore } from '@/stores/statsStore';
import { Theme } from '@/theme';

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSec}s`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  const theme = useTheme<Theme>();
  return (
    <Box
      backgroundColor="white"
      borderRadius="m"
      padding="m"
      flex={1}
      alignItems="center"
      style={{ borderWidth: 1, borderColor: theme.colors.border }}
    >
      <Text
        style={{
          fontSize: 24,
          fontFamily: 'Poppins_700Bold',
          color: theme.colors.textPrimary,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontFamily: 'Poppins_500Medium',
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
      {sub && (
        <Text style={{ fontSize: 9, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary, opacity: 0.6, marginTop: 2 }}>
          {sub}
        </Text>
      )}
    </Box>
  );
}

/** Last 7 days as YYYY-MM-DD strings, oldest first */
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()];
}

export default function StatsScreen() {
  const theme = useTheme<Theme>();
  const { streak, longestStreak, totalCardsStudied, totalCorrect, totalTimeMs, history, loadStats, isLoaded } = useStatsStore();

  useEffect(() => {
    if (!isLoaded) loadStats();
  }, [isLoaded, loadStats]);

  const accuracy = totalCardsStudied > 0 ? Math.round((totalCorrect / totalCardsStudied) * 100) : 0;

  const last7 = getLast7Days();
  const historyMap = new Map(history.map((d) => [d.date, d]));
  const maxCards = Math.max(...last7.map((d) => historyMap.get(d)?.cardsStudied ?? 0), 1);

  const recent7Cards = last7.reduce((s, d) => s + (historyMap.get(d)?.cardsStudied ?? 0), 0);
  const recent7Correct = last7.reduce((s, d) => s + (historyMap.get(d)?.correct ?? 0), 0);
  const recent7Accuracy = recent7Cards > 0 ? Math.round((recent7Correct / recent7Cards) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Box flex={1} backgroundColor="surface">
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          padding="m"
          style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
        >
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Poppins_700Bold',
              color: theme.colors.textPrimary,
              letterSpacing: -0.3,
              marginLeft: 12,
            }}
          >
            Estatísticas
          </Text>
        </Box>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Streak highlight */}
          <Box
            backgroundColor="primaryDark"
            borderRadius="m"
            padding="l"
            marginBottom="m"
            alignItems="center"
          >
            <Text style={{ fontSize: 48, marginBottom: 4 }}>🔥</Text>
            <Text
              style={{
                fontSize: 42,
                fontFamily: 'Poppins_700Bold',
                color: theme.colors.surfaceLight,
                letterSpacing: -1,
              }}
            >
              {streak}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins_500Medium',
                color: theme.colors.surfaceLight,
                opacity: 0.7,
                letterSpacing: 1,
              }}
            >
              {streak === 1 ? 'DIA SEGUIDO' : 'DIAS SEGUIDOS'}
            </Text>
            {longestStreak > 0 && (
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Poppins_400Regular',
                  color: theme.colors.surfaceLight,
                  opacity: 0.5,
                  marginTop: 8,
                }}
              >
                Recorde: {longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}
              </Text>
            )}
          </Box>

          {/* Stat grid */}
          <Box flexDirection="row" style={{ gap: 10 }} marginBottom="m">
            <StatCard label="Cards estudados" value={totalCardsStudied} />
            <StatCard label="Acurácia (7d)" value={recent7Cards > 0 ? `${recent7Accuracy}%` : '—'} sub={recent7Cards > 0 ? `${recent7Cards} cards` : 'sem dados'} />
          </Box>
          <Box flexDirection="row" style={{ gap: 10 }} marginBottom="m">
            <StatCard label="Acurácia total" value={`${accuracy}%`} />
            <StatCard label="Tempo total" value={totalTimeMs > 0 ? formatTime(totalTimeMs) : '—'} />
          </Box>
          <Box flexDirection="row" style={{ gap: 10 }} marginBottom="l">
            <StatCard label="Maior streak" value={longestStreak} sub={longestStreak === 1 ? 'dia' : 'dias'} />
            <StatCard label="Cards (7d)" value={recent7Cards} />
          </Box>

          {/* Weekly activity chart */}
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Poppins_600SemiBold',
              color: theme.colors.textSecondary,
              letterSpacing: 2.5,
              marginBottom: 12,
            }}
          >
            ÚLTIMOS 7 DIAS
          </Text>
          <Box
            backgroundColor="white"
            borderRadius="m"
            padding="m"
            marginBottom="l"
            style={{ borderWidth: 1, borderColor: theme.colors.border }}
          >
            <Box flexDirection="row" alignItems="flex-end" style={{ height: 80, gap: 6 }}>
              {last7.map((date) => {
                const day = historyMap.get(date);
                const count = day?.cardsStudied ?? 0;
                const heightPct = count > 0 ? Math.max(0.08, count / maxCards) : 0.04;
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <Box key={date} flex={1} alignItems="center" style={{ gap: 4 }}>
                    <View
                      style={{
                        flex: 1,
                        width: '100%',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <View
                        style={{
                          width: '100%',
                          height: `${heightPct * 100}%`,
                          backgroundColor: count > 0 ? theme.colors.primaryDark : theme.colors.border,
                          borderRadius: 3,
                          opacity: isToday ? 1 : count > 0 ? 0.7 : 0.4,
                          minHeight: 4,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 9,
                        fontFamily: isToday ? 'Poppins_700Bold' : 'Poppins_400Regular',
                        color: isToday ? theme.colors.textPrimary : theme.colors.textSecondary,
                      }}
                    >
                      {dayLabel(date)}
                    </Text>
                  </Box>
                );
              })}
            </Box>
            <Box flexDirection="row" justifyContent="space-between" marginTop="s">
              <Text style={{ fontSize: 9, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary }}>
                {last7.length > 0 ? last7[0].slice(5) : ''}
              </Text>
              <Text style={{ fontSize: 9, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary }}>
                hoje
              </Text>
            </Box>
          </Box>

          {/* Study history */}
          <Text
            style={{
              fontSize: 9,
              fontFamily: 'Poppins_600SemiBold',
              color: theme.colors.textSecondary,
              letterSpacing: 2.5,
              marginBottom: 12,
            }}
          >
            HISTÓRICO
          </Text>
          {history.length === 0 ? (
            <Box
              backgroundColor="white"
              borderRadius="m"
              padding="l"
              alignItems="center"
              style={{ borderWidth: 1, borderColor: theme.colors.border }}
            >
              <Text variant="bodySmall" color="textSecondary" textAlign="center">
                Nenhuma sessão registrada ainda.{'\n'}Comece a estudar!
              </Text>
            </Box>
          ) : (
            [...history]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 30)
              .map((day) => {
                const dayAcc = day.cardsStudied > 0 ? Math.round((day.correct / day.cardsStudied) * 100) : 0;
                return (
                  <Box
                    key={day.date}
                    backgroundColor="white"
                    borderRadius="s"
                    padding="m"
                    marginBottom="xs"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    style={{ borderWidth: 1, borderColor: theme.colors.border }}
                  >
                    <Box>
                      <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textPrimary }}>
                        {day.date}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary }}>
                        {day.cardsStudied} cards · {formatTime(day.timeMs)}
                      </Text>
                    </Box>
                    <View
                      style={{
                        backgroundColor: dayAcc >= 70 ? theme.colors.success + '22' : theme.colors.warning + '22',
                        borderRadius: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins_700Bold',
                          color: dayAcc >= 70 ? theme.colors.success : theme.colors.warning,
                        }}
                      >
                        {dayAcc}%
                      </Text>
                    </View>
                  </Box>
                );
              })
          )}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
