import { useState } from 'react';

import * as authApi from '../api/auth.api';
import { validateLoginForm } from '../auth.validation';
import { initialLoginForm } from '../types/auth.types';
import { useAuth } from './useAuth';

import type { LoginForm } from '../types/auth.types';

export function useLogin() {
  const { setSession } = useAuth();
  const [form, setForm] = useState<LoginForm>(initialLoginForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onChangeField(field: keyof LoginForm, value: string) {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit() {
    const validationError = validateLoginForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });
      await setSession(data);
    } catch (err) {
      setError(
        authApi.getAuthErrorMessage(err) ??
          'No se pudo iniciar sesión. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return { form, error, loading, onChangeField, onSubmit };
}
