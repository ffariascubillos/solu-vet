import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { TextInput } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import LoginScreen from '@/app/(auth)/login';
import RegisterScreen from '@/app/(auth)/register';
import { getSession, getTokens } from '@/src/services/token-storage';

import * as authApi from '../api/auth.api';
import { AuthProvider } from '../hooks/useAuth';

import type { AuthSessionData } from '../types/auth.types';

jest.mock('../api/auth.api');

const mockedApi = jest.mocked(authApi);

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

async function renderScreen(ui: React.ReactElement) {
  render(
    <PaperProvider>
      <AuthProvider>{ui}</AuthProvider>
    </PaperProvider>
  );
  await act(async () => {});

  return screen.UNSAFE_getAllByType(TextInput);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('inicia sesión con credenciales válidas y guarda la sesión', async () => {
    mockedApi.login.mockResolvedValue(sessionData);
    const [email, password] = await renderScreen(<LoginScreen />);

    fireEvent.changeText(email, 'ana@example.com');
    fireEvent.changeText(password, 'password123');
    fireEvent.press(screen.getByText('Iniciar sesión'));

    await waitFor(() =>
      expect(mockedApi.login).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'password123',
      })
    );
    await waitFor(() =>
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'soluvet.session',
        expect.any(String)
      )
    );
    expect(await getTokens()).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect((await getSession())?.user.email).toBe('ana@example.com');
  });
});

describe('RegisterScreen', () => {
  it('registra una cuenta independiente válida y guarda la sesión', async () => {
    mockedApi.register.mockResolvedValue(sessionData);
    const [name, email, password, confirm] = await renderScreen(<RegisterScreen />);

    fireEvent.changeText(name, 'Ana');
    fireEvent.changeText(email, 'ana@example.com');
    fireEvent.changeText(password, 'password123');
    fireEvent.changeText(confirm, 'password123');
    fireEvent.press(screen.getByText('Crear cuenta'));

    await waitFor(() =>
      expect(mockedApi.register).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationType: 'INDEPENDENT',
          name: 'Ana',
          email: 'ana@example.com',
          password: 'password123',
        })
      )
    );
    await waitFor(() =>
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'soluvet.session',
        expect.any(String)
      )
    );
    expect(await getTokens()).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect((await getSession())?.organization.type).toBe('INDEPENDENT');
  });
});
