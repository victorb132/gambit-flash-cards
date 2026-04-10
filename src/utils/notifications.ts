/**
 * Notification utilities — requires: npx expo install expo-notifications
 * All functions fail silently if the package is not installed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';

function getNotifications(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  try {
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    await N.scheduleNotificationAsync({
      content: {
        title: 'Hora de estudar! 🧠',
        body: 'Você tem cards esperando revisão no Gambit.',
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ENABLED, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_HOUR, String(hour));
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_MINUTE, String(minute));
  } catch {
    // silently fail
  }
}

export async function cancelAllNotifications(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_ENABLED, 'false');
  } catch {
    // silently fail
  }
}

export async function loadNotificationSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_ENABLED),
    AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_HOUR),
    AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_MINUTE),
  ]);
  return {
    enabled: enabled === 'true',
    hour: hour ? parseInt(hour, 10) : 8,
    minute: minute ? parseInt(minute, 10) : 0,
  };
}
