import { act, renderHook } from '@testing-library/react-native';

import * as authApi from '../api/auth.api';
import { useActivateAccount } from '../hooks/useActivateAccount';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { useInviteUser } from '../hooks/useInviteUser';
import { useLogin } from '../hooks/useLogin';
import { useRegister } from '../hooks/useRegister';
import { useResetPassword } from '../hooks/useResetPassword';

import type { AuthSessionData } from '../types/auth.types';

const mockSetSession = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ setSession: mockSetSession }),
}));
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

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useLogin', () => {
  it('muestra el error de validación sin llamar a la API', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Completa tu correo electrónico y contraseña.');
    expect(mockedApi.login).not.toHaveBeenCalled();
  });

  it('llama a login y guarda la sesión', async () => {
    mockedApi.login.mockResolvedValue(sessionData);
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.onChangeField('email', ' ana@example.com ');
      result.current.onChangeField('password', 'password123');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockedApi.login).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'password123',
    });
    expect(mockSetSession).toHaveBeenCalledWith(sessionData);
    expect(result.current.error).toBe('');
    expect(result.current.loading).toBe(false);
  });

  it('muestra el mensaje de la API ante un error', async () => {
    mockedApi.login.mockRejectedValue(new Error('401'));
    mockedApi.getAuthErrorMessage.mockReturnValue('Credenciales inválidas.');
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.onChangeField('email', 'ana@example.com');
      result.current.onChangeField('password', 'x');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Credenciales inválidas.');
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it('usa un mensaje genérico si la API no entrega mensaje', async () => {
    mockedApi.login.mockRejectedValue(new Error('network'));
    mockedApi.getAuthErrorMessage.mockReturnValue(null);
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.onChangeField('email', 'ana@example.com');
      result.current.onChangeField('password', 'x');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('No se pudo iniciar sesión. Intenta nuevamente.');
  });
});

describe('useRegister', () => {
  function fillValid(result: { current: ReturnType<typeof useRegister> }) {
    act(() => {
      result.current.onChangeField('name', 'Ana');
      result.current.onChangeField('email', 'ana@example.com');
      result.current.onChangeField('password', 'password123');
      result.current.onChangeField('confirmPassword', 'password123');
    });
  }

  it('muestra el error de validación sin llamar a la API', async () => {
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Completa los datos obligatorios.');
    expect(mockedApi.register).not.toHaveBeenCalled();
  });

  it('llama a register y guarda la sesión', async () => {
    mockedApi.register.mockResolvedValue(sessionData);
    const { result } = renderHook(() => useRegister());

    fillValid(result);
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockedApi.register).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationType: 'INDEPENDENT',
        email: 'ana@example.com',
        password: 'password123',
        name: 'Ana',
      })
    );
    expect(mockSetSession).toHaveBeenCalledWith(sessionData);
  });

  it('muestra el mensaje de la API ante un error', async () => {
    mockedApi.register.mockRejectedValue(new Error('409'));
    mockedApi.getAuthErrorMessage.mockReturnValue('El correo ya está registrado.');
    const { result } = renderHook(() => useRegister());

    fillValid(result);
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('El correo ya está registrado.');
    expect(mockSetSession).not.toHaveBeenCalled();
  });
});

describe('useForgotPassword', () => {
  it('rechaza un email inválido sin llamar a la API', async () => {
    const { result } = renderHook(() => useForgotPassword());

    act(() => result.current.onChangeEmail('invalido'));
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Ingresa un correo electrónico válido.');
    expect(result.current.success).toBe(false);
    expect(mockedApi.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('marca success con el mensaje genérico', async () => {
    mockedApi.requestPasswordReset.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useForgotPassword());

    act(() => result.current.onChangeEmail('ana@example.com'));
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockedApi.requestPasswordReset).toHaveBeenCalledWith('ana@example.com');
    expect(result.current.success).toBe(true);
    expect(result.current.message).toBe(
      'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.'
    );
  });

  it('marca success aunque la API falle, para no revelar si el correo existe', async () => {
    mockedApi.requestPasswordReset.mockRejectedValue(new Error('404'));
    const { result } = renderHook(() => useForgotPassword());

    act(() => result.current.onChangeEmail('ana@example.com'));
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBe('');
  });
});

describe('useResetPassword', () => {
  it('rechaza si no hay token', async () => {
    const { result } = renderHook(() => useResetPassword(undefined));

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('El enlace no es válido o ya expiró.');
    expect(mockedApi.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña corta o que no coincide', async () => {
    const { result } = renderHook(() => useResetPassword('tok'));

    act(() => {
      result.current.onChangeField('newPassword', 'corta');
      result.current.onChangeField('confirmPassword', 'corta');
    });
    await act(async () => {
      await result.current.onSubmit();
    });
    expect(result.current.error).toBe('La contraseña debe tener al menos 8 caracteres.');

    act(() => {
      result.current.onChangeField('newPassword', 'password123');
      result.current.onChangeField('confirmPassword', 'password124');
    });
    await act(async () => {
      await result.current.onSubmit();
    });
    expect(result.current.error).toBe('Las contraseñas no coinciden.');
    expect(mockedApi.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it('confirma el reset y marca success', async () => {
    mockedApi.confirmPasswordReset.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useResetPassword('tok'));

    act(() => {
      result.current.onChangeField('newPassword', 'password123');
      result.current.onChangeField('confirmPassword', 'password123');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockedApi.confirmPasswordReset).toHaveBeenCalledWith('tok', 'password123');
    expect(result.current.success).toBe(true);
  });

  it('muestra el mensaje de la API ante un error', async () => {
    mockedApi.confirmPasswordReset.mockRejectedValue(new Error('400'));
    mockedApi.getAuthErrorMessage.mockReturnValue('Token expirado.');
    const { result } = renderHook(() => useResetPassword('tok'));

    act(() => {
      result.current.onChangeField('newPassword', 'password123');
      result.current.onChangeField('confirmPassword', 'password123');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Token expirado.');
    expect(result.current.success).toBe(false);
  });
});

describe('useActivateAccount', () => {
  it('rechaza si no hay token', async () => {
    const { result } = renderHook(() => useActivateAccount(undefined));

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('El enlace no es válido o ya expiró.');
    expect(mockedApi.activateInvitation).not.toHaveBeenCalled();
  });

  it('rechaza contraseñas que no coinciden', async () => {
    const { result } = renderHook(() => useActivateAccount('tok'));

    act(() => {
      result.current.onChangeField('password', 'password123');
      result.current.onChangeField('confirmPassword', 'otra-clave-1');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Las contraseñas no coinciden.');
    expect(mockedApi.activateInvitation).not.toHaveBeenCalled();
  });

  it('activa la cuenta y marca success', async () => {
    mockedApi.activateInvitation.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useActivateAccount('tok'));

    act(() => {
      result.current.onChangeField('password', 'password123');
      result.current.onChangeField('confirmPassword', 'password123');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockedApi.activateInvitation).toHaveBeenCalledWith('tok', 'password123');
    expect(result.current.success).toBe(true);
  });

  it('muestra el mensaje de la API ante un error', async () => {
    mockedApi.activateInvitation.mockRejectedValue(new Error('400'));
    mockedApi.getAuthErrorMessage.mockReturnValue('Invitación inválida.');
    const { result } = renderHook(() => useActivateAccount('tok'));

    act(() => {
      result.current.onChangeField('password', 'password123');
      result.current.onChangeField('confirmPassword', 'password123');
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Invitación inválida.');
  });
});

describe('useInviteUser', () => {
  it('rechaza un email inválido sin llamar a la API', async () => {
    const { result } = renderHook(() => useInviteUser());

    act(() => result.current.onChangeEmail('invalido'));
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('Ingresa un correo electrónico válido.');
    expect(mockedApi.inviteUser).not.toHaveBeenCalled();
  });

  it('envía la invitación, marca success y limpia el email', async () => {
    mockedApi.inviteUser.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useInviteUser());

    act(() => result.current.onChangeEmail(' nuevo@example.com '));
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(mockedApi.inviteUser).toHaveBeenCalledWith('nuevo@example.com');
    expect(result.current.success).toBe(true);
    expect(result.current.email).toBe('');
  });

  it('muestra el mensaje de la API ante un error', async () => {
    mockedApi.inviteUser.mockRejectedValue(new Error('409'));
    mockedApi.getAuthErrorMessage.mockReturnValue('El usuario ya existe.');
    const { result } = renderHook(() => useInviteUser());

    act(() => result.current.onChangeEmail('nuevo@example.com'));
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(result.current.error).toBe('El usuario ya existe.');
    expect(result.current.success).toBe(false);
  });
});
