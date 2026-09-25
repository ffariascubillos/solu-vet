import { AxiosError } from 'axios';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

import { api, setOnSessionExpired } from '../api';
import { getSession, getTokens, setSession, setTokens } from '../token-storage';

type Handler = (config: InternalAxiosRequestConfig) => {
  status: number;
  data?: unknown;
};

const calls: InternalAxiosRequestConfig[] = [];

function useAdapter(handler: Handler) {
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const { status, data } = handler(config);
    const response = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
    };

    if (status >= 400) {
      throw new AxiosError('fail', undefined, config, null, response);
    }

    return response;
  };

  api.defaults.adapter = adapter;
}

const oldTokens = { accessToken: 'old-access', refreshToken: 'old-refresh' };
const newTokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };

describe('api interceptors', () => {
  const onExpired = jest.fn();

  beforeEach(() => {
    calls.length = 0;
    onExpired.mockClear();
    setOnSessionExpired(onExpired);
  });

  it('agrega el header Authorization cuando hay tokens', async () => {
    await setTokens(oldTokens);
    useAdapter(() => ({ status: 200, data: { ok: true } }));

    await api.get('/patients');

    expect(calls[0].headers.get('Authorization')).toBe('Bearer old-access');
  });

  it('no agrega Authorization cuando no hay tokens', async () => {
    useAdapter(() => ({ status: 200, data: { ok: true } }));

    await api.get('/patients');

    expect(calls[0].headers.get('Authorization')).toBeFalsy();
  });

  it('ante un 401 refresca los tokens y reintenta la request una sola vez', async () => {
    await setTokens(oldTokens);
    useAdapter((config) => {
      if (config.url === '/auth/refresh') {
        return { status: 200, data: { ok: true, data: newTokens } };
      }

      return config.headers.get('Authorization') === 'Bearer new-access'
        ? { status: 200, data: { ok: true, data: 'done' } }
        : { status: 401 };
    });

    const response = await api.get('/patients');

    expect(response.data.data).toBe('done');
    expect(calls.map((c) => c.url)).toEqual([
      '/patients',
      '/auth/refresh',
      '/patients',
    ]);
    expect(JSON.parse(calls[1].data)).toEqual({ refreshToken: 'old-refresh' });
    expect(await getTokens()).toEqual(newTokens);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('no reintenta más de una vez si la request sigue devolviendo 401', async () => {
    await setTokens(oldTokens);
    useAdapter((config) =>
      config.url === '/auth/refresh'
        ? { status: 200, data: { ok: true, data: newTokens } }
        : { status: 401 }
    );

    await expect(api.get('/patients')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(calls.filter((c) => c.url === '/patients')).toHaveLength(2);
    expect(calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  });

  it('si el refresh falla limpia el storage y llama al callback de sesión expirada', async () => {
    await setTokens(oldTokens);
    await setSession({
      user: { id: 'u1', email: 'a@b.cl', name: 'A', role: 'OWNER' },
      organization: {
        id: 'o1',
        name: 'A',
        type: 'INDEPENDENT',
        trialEndsAt: null,
        subscriptionStatus: 'TRIALING',
      },
    });
    useAdapter((config) =>
      config.url === '/auth/refresh' ? { status: 500 } : { status: 401 }
    );

    await expect(api.get('/patients')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(await getTokens()).toBeNull();
    expect(await getSession()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('si el refresh responde 401 no entra en bucle: una sola llamada a refresh, limpia y notifica', async () => {
    await setTokens(oldTokens);
    await setSession({
      user: { id: 'u1', email: 'a@b.cl', name: 'A', role: 'OWNER' },
      organization: {
        id: 'o1',
        name: 'A',
        type: 'INDEPENDENT',
        trialEndsAt: null,
        subscriptionStatus: 'TRIALING',
      },
    });
    useAdapter(() => {
      if (calls.length > 10) {
        throw new Error('demasiadas llamadas: posible bucle de refresh');
      }

      return { status: 401 };
    });

    await expect(api.get('/patients')).rejects.toMatchObject({
      response: { status: 401 },
      config: { url: '/patients' },
    });

    expect(calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
    expect(calls).toHaveLength(2);
    expect(await getTokens()).toBeNull();
    expect(await getSession()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('un 401 sin header Authorization (login) no dispara refresh', async () => {
    useAdapter(() => ({ status: 401, data: { ok: false } }));

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(calls).toHaveLength(1);
    expect(onExpired).not.toHaveBeenCalled();
  });
});
