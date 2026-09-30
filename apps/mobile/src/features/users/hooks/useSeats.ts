import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { getAuthErrorMessage } from '@/src/features/auth/api/auth.api';

import * as usersApi from '../api/users.api';
import type { SeatsData } from '../types/users.types';

export function useSeats() {
  const [data, setData] = useState<SeatsData | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      setData(await usersApi.getSeats());
      setError('');
    } catch (err) {
      setError(
        getAuthErrorMessage(err) ??
          'No se pudieron cargar los usuarios de la clínica.'
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function runAndReload(action: () => Promise<unknown>) {
    try {
      await action();
      await reload();
    } catch (err) {
      setError(
        getAuthErrorMessage(err) ?? 'No se pudo completar la acción. Intenta nuevamente.'
      );
    }
  }

  const limit = data?.limit ?? 0;
  const seats = data?.seats ?? [];

  return {
    limit,
    seats,
    isFull: data !== null && seats.length >= limit,
    loading: data === null && !error,
    error,
    reload,
    cancelInvitation: (id: string) => runAndReload(() => usersApi.cancelInvitation(id)),
    removeUser: (id: string) => runAndReload(() => usersApi.removeUser(id)),
  };
}
