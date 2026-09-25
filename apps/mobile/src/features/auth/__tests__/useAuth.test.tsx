import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { setOnSessionExpired } from '@/src/services/api';
import {
  getSession,
  getTokens,
  setSession as storeSession,
  setTokens,
} from '@/src/services/token-storage';

import * as authApi from '../api/auth.api';
import { AuthProvider, useAuth } from '../hooks/useAuth';

import type { AuthSessionData } from '../types/auth.types';

jest.mock('@/src/services/api', () => ({ setOnSessionExpired: jest.fn() }));
jest.mock('../api/auth.api');

const mockedApi = jest.mocked(authApi);
const mockedSetOnSessionExpired = jest.mocked(setOnSessionExpired);

const sessionData: AuthSessionData = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: { id: 'u1', email: 'ana@example.com', name: 'Ana', role: 'OWNER' },
  organization: {
    id: 'o1',
    name: 'Ana',
    type: 'INDEPENDENT',
    trialEndsAt: null,
    subscriptionStatus: 'TRIALING',
  },
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

async function renderReady() {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
}

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hidrata la sesión desde el storage al montar', async () => {
    await setTokens({ accessToken: 'access', refreshToken: 'refresh' });
    await storeSession({ user: sessionData.user, organization: sessionData.organization });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(sessionData.user);
    expect(result.current.organization).toEqual(sessionData.organization);
  });

  it('queda sin autenticar si no hay datos guardados', async () => {
    const { result } = await renderReady();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('registra el callback de sesión expirada y este limpia el estado', async () => {
    const { result } = await renderReady();

    await act(async () => {
      await result.current.setSession(sessionData);
    });
    expect(result.current.isAuthenticated).toBe(true);

    const callback = mockedSetOnSessionExpired.mock.calls[0][0];

    act(() => {
      callback();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.organization).toBeNull();
  });

  it('setSession persiste tokens y sesión y actualiza el estado', async () => {
    const { result } = await renderReady();

    await act(async () => {
      await result.current.setSession(sessionData);
    });

    expect(result.current.user).toEqual(sessionData.user);
    expect(await getTokens()).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect(await getSession()).toEqual({
      user: sessionData.user,
      organization: sessionData.organization,
    });
  });

  it('logout llama a la API y limpia storage y estado', async () => {
    mockedApi.logout.mockResolvedValue({ ok: true });
    const { result } = await renderReady();
    await act(async () => {
      await result.current.setSession(sessionData);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedApi.logout).toHaveBeenCalledWith('refresh');
    expect(result.current.isAuthenticated).toBe(false);
    expect(await getTokens()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it('logout limpia storage y estado aunque la API falle', async () => {
    mockedApi.logout.mockRejectedValue(new Error('network'));
    const { result } = await renderReady();
    await act(async () => {
      await result.current.setSession(sessionData);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(await getTokens()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it('logoutAll limpia storage y estado', async () => {
    mockedApi.logoutAll.mockResolvedValue({ ok: true });
    const { result } = await renderReady();
    await act(async () => {
      await result.current.setSession(sessionData);
    });

    await act(async () => {
      await result.current.logoutAll();
    });

    expect(mockedApi.logoutAll).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(await getTokens()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it('logoutAll limpia storage y estado aunque la API falle', async () => {
    mockedApi.logoutAll.mockRejectedValue(new Error('network'));
    const { result } = await renderReady();
    await act(async () => {
      await result.current.setSession(sessionData);
    });

    await act(async () => {
      await result.current.logoutAll();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(await getTokens()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it('useAuth lanza error fuera de un AuthProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth debe usarse dentro de un AuthProvider.'
    );
  });
});
