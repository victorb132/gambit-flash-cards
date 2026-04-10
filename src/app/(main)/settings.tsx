import React, { useEffect, useState } from 'react';
import { View, Switch, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { ArrowLeft, Sun, Moon, Bell, BellSlash, Trash, User } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Box from '../../components/ui/Box';
import Text from '../../components/ui/Text';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import { Theme } from '../../theme';
import { STORAGE_KEYS } from '../../utils/constants';
import {
  loadNotificationSettings,
  scheduleDailyReminder,
  cancelAllNotifications,
  requestNotificationPermission,
} from '../../utils/notifications';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme<Theme>();
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingVertical="m"
      style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
    >
      <Text variant="bodySmall" color="textPrimary" style={{ fontFamily: 'Poppins_500Medium' }}>
        {label}
      </Text>
      {children}
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme<Theme>();
  return (
    <Box marginBottom="l">
      <Text
        style={{
          fontSize: 9,
          fontFamily: 'Poppins_600SemiBold',
          color: theme.colors.textSecondary,
          letterSpacing: 2.5,
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

export default function SettingsScreen() {
  const theme = useTheme<Theme>();
  const { isDark, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(8);
  const [notifMinute, setNotifMinute] = useState(0);
  const [hourInput, setHourInput] = useState('08');
  const [minuteInput, setMinuteInput] = useState('00');

  useEffect(() => {
    loadNotificationSettings().then(({ enabled, hour, minute }) => {
      setNotifEnabled(enabled);
      setNotifHour(hour);
      setNotifMinute(minute);
      setHourInput(String(hour).padStart(2, '0'));
      setMinuteInput(String(minute).padStart(2, '0'));
    });
  }, []);

  async function handleToggleNotifications(val: boolean) {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permissão necessária',
          'Ative as notificações nas configurações do sistema para receber lembretes.',
        );
        return;
      }
      await scheduleDailyReminder(notifHour, notifMinute);
    } else {
      await cancelAllNotifications();
    }
    setNotifEnabled(val);
  }

  async function handleSaveNotifTime() {
    const h = Math.min(23, Math.max(0, parseInt(hourInput, 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minuteInput, 10) || 0));
    setNotifHour(h);
    setNotifMinute(m);
    setHourInput(String(h).padStart(2, '0'));
    setMinuteInput(String(m).padStart(2, '0'));
    if (notifEnabled) {
      await scheduleDailyReminder(h, m);
    }
  }

  async function handleClearData() {
    Alert.alert(
      'Limpar dados',
      'Isso vai apagar todos os decks, flashcards e histórico de estudo. Não tem volta!',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar tudo',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.MOCK_DECKS,
              STORAGE_KEYS.MOCK_FLASHCARDS,
              STORAGE_KEYS.MOCK_SESSIONS,
              STORAGE_KEYS.STATS,
            ]);
            Alert.alert('Dados apagados', 'Reinicie o app para ver as mudanças.');
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

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
            Configurações
          </Text>
        </Box>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile */}
          <Section title="PERFIL">
            <Box
              backgroundColor="white"
              borderRadius="m"
              padding="m"
              style={{ borderWidth: 1, borderColor: theme.colors.border }}
            >
              <Box flexDirection="row" alignItems="center" style={{ gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: theme.colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={22} color={theme.colors.textSecondary} />
                </View>
                <Box flex={1}>
                  <Text style={{ fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textPrimary }}>
                    {user?.name ?? '—'}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary }}>
                    {user?.email ?? '—'}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Section>

          {/* Aparência */}
          <Section title="APARÊNCIA">
            <Box backgroundColor="white" borderRadius="m" paddingHorizontal="m" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
              <Row label="Modo escuro">
                <Box flexDirection="row" alignItems="center" style={{ gap: 8 }}>
                  <Sun size={16} color={theme.colors.textSecondary} />
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryDark }}
                    thumbColor={theme.colors.surfaceLight}
                  />
                  <Moon size={16} color={theme.colors.textSecondary} />
                </Box>
              </Row>
            </Box>
          </Section>

          {/* Notificações */}
          <Section title="NOTIFICAÇÕES">
            <Box backgroundColor="white" borderRadius="m" paddingHorizontal="m" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
              <Row label="Lembrete diário">
                <Box flexDirection="row" alignItems="center" style={{ gap: 8 }}>
                  {notifEnabled ? (
                    <Bell size={16} color={theme.colors.textPrimary} weight="fill" />
                  ) : (
                    <BellSlash size={16} color={theme.colors.textSecondary} />
                  )}
                  <Switch
                    value={notifEnabled}
                    onValueChange={handleToggleNotifications}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryDark }}
                    thumbColor={theme.colors.surfaceLight}
                  />
                </Box>
              </Row>
              {notifEnabled && (
                <Box paddingVertical="m" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 1.5, marginBottom: 10 }}>
                    HORÁRIO DO LEMBRETE
                  </Text>
                  <Box flexDirection="row" alignItems="center" style={{ gap: 8 }}>
                    <TextInput
                      value={hourInput}
                      onChangeText={setHourInput}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        width: 52,
                        height: 40,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: 6,
                        textAlign: 'center',
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 16,
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.surfaceLight,
                      }}
                    />
                    <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: theme.colors.textPrimary }}>:</Text>
                    <TextInput
                      value={minuteInput}
                      onChangeText={setMinuteInput}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={{
                        width: 52,
                        height: 40,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: 6,
                        textAlign: 'center',
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 16,
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.surfaceLight,
                      }}
                    />
                    <TouchableOpacity onPress={handleSaveNotifTime} style={{ marginLeft: 8 }}>
                      <Box
                        backgroundColor="primaryDark"
                        borderRadius="s"
                        paddingHorizontal="m"
                        paddingVertical="s"
                      >
                        <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: theme.colors.surfaceLight }}>
                          Salvar
                        </Text>
                      </Box>
                    </TouchableOpacity>
                  </Box>
                  <Text style={{ fontSize: 10, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary, marginTop: 6 }}>
                    Requer: npx expo install expo-notifications
                  </Text>
                </Box>
              )}
            </Box>
          </Section>

          {/* Dados */}
          <Section title="DADOS">
            <Box backgroundColor="white" borderRadius="m" paddingHorizontal="m" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
              <TouchableOpacity onPress={handleClearData}>
                <Box
                  paddingVertical="m"
                  flexDirection="row"
                  alignItems="center"
                  style={{ gap: 10 }}
                >
                  <Trash size={17} color={theme.colors.error} />
                  <Text style={{ fontSize: 14, fontFamily: 'Poppins_500Medium', color: theme.colors.error }}>
                    Limpar todos os dados
                  </Text>
                </Box>
              </TouchableOpacity>
            </Box>
          </Section>

          {/* Conta */}
          <Section title="CONTA">
            <Box backgroundColor="white" borderRadius="m" paddingHorizontal="m" style={{ borderWidth: 1, borderColor: theme.colors.border }}>
              <TouchableOpacity onPress={handleLogout}>
                <Box paddingVertical="m" alignItems="center">
                  <Text style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: theme.colors.textSecondary, letterSpacing: 0.3 }}>
                    Sair da conta
                  </Text>
                </Box>
              </TouchableOpacity>
            </Box>
          </Section>

          <Text style={{ fontSize: 10, fontFamily: 'Poppins_400Regular', color: theme.colors.textSecondary, textAlign: 'center', opacity: 0.5 }}>
            Gambit Flash Cards v1.0
          </Text>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
}
