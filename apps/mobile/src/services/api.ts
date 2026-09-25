import { create } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { clearSession, clearTokens, getTokens, setTokens } from './token-storage';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL no está definida. Copia apps/mobile/.env.example a apps/mobile/.env y configura la URL de tu backend.'
  );
}

export const api = create({
  baseURL: apiUrl,
  timeout: 10000,
});

let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(cb: () => void) {
  onSessionExpired = cb;
}

api.interceptors.request.use(async (config) => {
  const tokens = await getTokens();

  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      !originalRequest.headers?.Authorization ||
      originalRequest._retry ||
      originalRequest.url === '/auth/refresh'
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const tokens = await getTokens();

      if (!tokens?.refreshToken) {
        throw error;
      }

      const response = await api.post('/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });

      const newTokens = response.data.data;
      await setTokens(newTokens);

      originalRequest.headers.set(
        'Authorization',
        `Bearer ${newTokens.accessToken}`
      );

      return api(originalRequest);
    } catch {
      await clearTokens();
      await clearSession();
      onSessionExpired?.();
      return Promise.reject(error);
    }
  }
);
