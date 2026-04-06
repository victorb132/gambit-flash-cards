import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  loadPersistedAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token, refreshToken) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  /** Returns true if a valid persisted session was found */
  loadPersistedAuth: async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (token && userRaw) {
      const user: User = JSON.parse(userRaw);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },
}));
