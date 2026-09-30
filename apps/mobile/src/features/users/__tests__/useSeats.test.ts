import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as usersApi from '../api/users.api';
import { useSeats } from '../hooks/useSeats';
import type { Seat, SeatsData } from '../types/users.types';

jest.mock('@/src/features/auth/api/auth.api');
jest.mock('../api/users.api');

jest.mock('@react-navigation/native', () => {
  const { useEffect } = jest.requireActual('react');

  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      useEffect(callback, [callback]);
    },
  };
});

const mockedUsersApi = jest.mocked(usersApi);

function seat(id: string, overrides: Partial<Seat> = {}): Seat {
  return {
    id,
    kind: 'USER',
    name: `Usuario ${id}`,
    email: `${id}@example.com`,
    role: 'VETERINARIAN',
    status: 'ACTIVE',
    ...overrides,
  };
}

function seatsData(count: number, limit = 5): SeatsData {
  return {
    limit,
    seats: Array.from({ length: count }, (_, index) => seat(`s${index}`)),
  };
}

async function renderLoaded() {
  const hook = renderHook(() => useSeats());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useSeats', () => {
  it('isFull es false cuando quedan cupos', async () => {
    mockedUsersApi.getSeats.mockResolvedValue(seatsData(4));

    const { result } = await renderLoaded();

    expect(result.current.limit).toBe(5);
    expect(result.current.seats).toHaveLength(4);
    expect(result.current.isFull).toBe(false);
  });

  it('isFull es true cuando los cupos igualan el límite', async () => {
    mockedUsersApi.getSeats.mockResolvedValue(seatsData(5));

    const { result } = await renderLoaded();

    expect(result.current.isFull).toBe(true);
  });

  it('isFull es true cuando los cupos superan el límite', async () => {
    mockedUsersApi.getSeats.mockResolvedValue(seatsData(6));

    const { result } = await renderLoaded();

    expect(result.current.isFull).toBe(true);
  });

  it('cancelInvitation llama a la API y recarga los cupos', async () => {
    const pending = seat('inv1', { kind: 'INVITATION', status: 'PENDING', name: null });
    mockedUsersApi.getSeats.mockResolvedValueOnce({ limit: 5, seats: [seat('owner'), pending] });
    mockedUsersApi.getSeats.mockResolvedValueOnce({ limit: 5, seats: [seat('owner')] });
    mockedUsersApi.cancelInvitation.mockResolvedValue({ ok: true });

    const { result } = await renderLoaded();
    expect(mockedUsersApi.getSeats).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.cancelInvitation('inv1');
    });

    expect(mockedUsersApi.cancelInvitation).toHaveBeenCalledWith('inv1');
    expect(mockedUsersApi.getSeats).toHaveBeenCalledTimes(2);
    expect(result.current.seats).toHaveLength(1);
  });

  it('removeUser llama a la API y recarga los cupos', async () => {
    mockedUsersApi.getSeats.mockResolvedValueOnce({ limit: 5, seats: [seat('owner'), seat('u1')] });
    mockedUsersApi.getSeats.mockResolvedValueOnce({ limit: 5, seats: [seat('owner')] });
    mockedUsersApi.removeUser.mockResolvedValue({ ok: true });

    const { result } = await renderLoaded();
    expect(mockedUsersApi.getSeats).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.removeUser('u1');
    });

    expect(mockedUsersApi.removeUser).toHaveBeenCalledWith('u1');
    expect(mockedUsersApi.getSeats).toHaveBeenCalledTimes(2);
    expect(result.current.seats).toHaveLength(1);
  });
});
