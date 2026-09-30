import { act, renderHook } from '@testing-library/react-native';

import * as authApi from '@/src/features/auth/api/auth.api';

import * as usersApi from '../api/users.api';
import { useInviteUser } from '../hooks/useInviteUser';

jest.mock('@/src/features/auth/api/auth.api');
jest.mock('../api/users.api');

const mockedAuthApi = jest.mocked(authApi);
const mockedUsersApi = jest.mocked(usersApi);

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useInviteUser', () => {
  it('rechaza un email inválido sin llamar a la API', async () => {
    const { result } = renderHook(() => useInviteUser());

    act(() => result.current.onChangeEmail('invalido'));
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Ingresa un correo electrónico válido.');
    expect(mockedUsersApi.inviteUser).not.toHaveBeenCalled();
  });

  it('exige un cargo antes de enviar sin llamar a la API', async () => {
    const { result } = renderHook(() => useInviteUser());

    act(() => result.current.onChangeEmail('nuevo@example.com'));
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Selecciona un cargo.');
    expect(result.current.success).toBe(false);
    expect(mockedUsersApi.inviteUser).not.toHaveBeenCalled();
  });

  it('envía la invitación, marca success y limpia el email', async () => {
    mockedUsersApi.inviteUser.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useInviteUser());

    act(() => {
      result.current.onChangeEmail(' nuevo@example.com ');
      result.current.onChangeRole('RECEPTIONIST');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockedUsersApi.inviteUser).toHaveBeenCalledWith('nuevo@example.com', 'RECEPTIONIST');
    expect(result.current.success).toBe(true);
    expect(result.current.email).toBe('');
  });

  it('muestra el mensaje de la API ante un error', async () => {
    mockedUsersApi.inviteUser.mockRejectedValue(new Error('409'));
    mockedAuthApi.getAuthErrorMessage.mockReturnValue('El usuario ya existe.');
    const { result } = renderHook(() => useInviteUser());

    act(() => {
      result.current.onChangeEmail('nuevo@example.com');
      result.current.onChangeRole('RECEPTIONIST');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('El usuario ya existe.');
    expect(result.current.success).toBe(false);
  });
});
