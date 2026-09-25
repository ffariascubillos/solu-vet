import { api } from '@/src/services/api';
import { isAxiosError } from 'axios';

import type { AuthSessionData, RegisterForm } from '../types/auth.types';

type AuthResponse = {
  ok: boolean;
  data: AuthSessionData;
};

type RefreshResponse = {
  ok: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
};

type OkResponse = {
  ok: boolean;
  message?: string;
};

type ApiErrorResponse = {
  ok: false;
  field?: string;
  message?: string;
};

export async function login(credentials: { email: string; password: string }) {
  const response = await api.post<AuthResponse>('/auth/login', credentials);

  return response.data.data;
}

export async function register(data: Omit<RegisterForm, 'confirmPassword'>) {
  const body =
    data.organizationType === 'CLINIC'
      ? {
          organizationType: 'CLINIC' as const,
          email: data.email,
          password: data.password,
          name: data.name,
          organizationName: data.clinicName,
        }
      : {
          organizationType: 'INDEPENDENT' as const,
          email: data.email,
          password: data.password,
          name: data.name,
        };

  const response = await api.post<AuthResponse>('/auth/register', body);

  return response.data.data;
}

export async function refreshTokens(refreshToken: string) {
  const response = await api.post<RefreshResponse>('/auth/refresh', {
    refreshToken,
  });

  return response.data.data;
}

export async function logout(refreshToken: string) {
  const response = await api.post<OkResponse>('/auth/logout', {
    refreshToken,
  });

  return response.data;
}

export async function logoutAll() {
  const response = await api.post<OkResponse>('/auth/logout-all');

  return response.data;
}

export async function requestPasswordReset(email: string) {
  const response = await api.post<OkResponse>('/auth/password-reset/request', {
    email,
  });

  return response.data;
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const response = await api.post<OkResponse>('/auth/password-reset/confirm', {
    token,
    newPassword,
  });

  return response.data;
}

export async function activateInvitation(token: string, password: string) {
  const response = await api.post<OkResponse>('/auth/activate', {
    token,
    password,
  });

  return response.data;
}

export async function inviteUser(email: string) {
  const response = await api.post<OkResponse>('/users/invite', {
    email,
    role: 'OWNER',
  });

  return response.data;
}

export function getAuthErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data as ApiErrorResponse | undefined;

  return data?.message ?? null;
}
