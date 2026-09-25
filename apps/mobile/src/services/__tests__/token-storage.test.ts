import * as SecureStore from 'expo-secure-store';

import {
  clearSession,
  clearTokens,
  getSession,
  getTokens,
  setSession,
  setTokens,
} from '../token-storage';

import type { StoredSession } from '../token-storage';

const tokens = { accessToken: 'access', refreshToken: 'refresh' };

const session: StoredSession = {
  user: { id: 'u1', email: 'ana@example.com', name: 'Ana', role: 'OWNER' },
  organization: {
    id: 'o1',
    name: 'Ana',
    type: 'INDEPENDENT',
    trialEndsAt: null,
    subscriptionStatus: 'TRIALING',
  },
};

describe('token-storage', () => {
  it('devuelve null cuando no hay tokens ni sesión', async () => {
    expect(await getTokens()).toBeNull();
    expect(await getSession()).toBeNull();
  });

  it('guarda y lee tokens', async () => {
    await setTokens(tokens);

    expect(await getTokens()).toEqual(tokens);
  });

  it('borra los tokens', async () => {
    await setTokens(tokens);
    await clearTokens();

    expect(await getTokens()).toBeNull();
  });

  it('guarda y lee la sesión', async () => {
    await setSession(session);

    expect(await getSession()).toEqual(session);
  });

  it('borra la sesión', async () => {
    await setSession(session);
    await clearSession();

    expect(await getSession()).toBeNull();
  });

  it('lanza error si el JSON almacenado está malformado', async () => {
    await SecureStore.setItemAsync('soluvet.tokens', '{malformado');
    await SecureStore.setItemAsync('soluvet.session', 'no-json');

    await expect(getTokens()).rejects.toThrow(SyntaxError);
    await expect(getSession()).rejects.toThrow(SyntaxError);
  });
});
