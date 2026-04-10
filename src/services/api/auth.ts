import { USE_MOCK } from '@/utils/constants';
import { LoginRequest, RegisterRequest, LoginResponse, User } from '@/types/auth';
import { mockLogin, mockRegister, mockGetMe, mockLogout } from '@/services/mock/handlers';
import apiClient from '@/services/api/client';

export async function register(data: RegisterRequest): Promise<LoginResponse> {
  if (USE_MOCK) return mockRegister(data);
  const response = await apiClient.post<LoginResponse>('/auth/register', data);
  return response.data;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK) return mockLogin(data);
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function getMe(): Promise<User> {
  if (USE_MOCK) return mockGetMe('');
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}

export async function logout(): Promise<{ message: string }> {
  if (USE_MOCK) return mockLogout();
  const response = await apiClient.post<{ message: string }>('/auth/logout');
  return response.data;
}
