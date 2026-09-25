import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKENS_KEY = 'soluvet.tokens';
const SESSION_KEY = 'soluvet.session';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export type StoredSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
    type: 'INDEPENDENT' | 'CLINIC';
    trialEndsAt: string | null;
    subscriptionStatus: string;
  };
};

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export async function getTokens(): Promise<StoredTokens | null> {
  const raw = await storage.get(TOKENS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setTokens(tokens: StoredTokens): Promise<void> {
  await storage.set(TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await storage.remove(TOKENS_KEY);
}

export async function getSession(): Promise<StoredSession | null> {
  const raw = await storage.get(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setSession(session: StoredSession): Promise<void> {
  await storage.set(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await storage.remove(SESSION_KEY);
}
