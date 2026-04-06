import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { login as loginApi, logout as logoutApi, getMe } from '../services/api/auth';
import { isValidEmail, isValidPassword } from '../utils/validators';

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, loadPersistedAuth } =
    useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});

  async function login(email: string, password: string): Promise<boolean> {
    const newErrors: LoginFormErrors = {};

    if (!isValidEmail(email)) newErrors.email = 'Informe um e-mail válido.';
    if (!isValidPassword(password)) newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const response = await loginApi({ email: email.trim(), password });
      await setAuth(response.user, response.token, response.refreshToken);
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao fazer login. Tente novamente.';
      setErrors({ general: message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    try {
      await logoutApi();
    } finally {
      await clearAuth();
    }
  }

  async function validateSession(): Promise<boolean> {
    try {
      const user = await getMe();
      if (user) return true;
      await clearAuth();
      return false;
    } catch {
      await clearAuth();
      return false;
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isSubmitting,
    errors,
    login,
    logout,
    validateSession,
    loadPersistedAuth,
    clearErrors: () => setErrors({}),
  };
}
