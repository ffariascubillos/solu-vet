import { useState } from 'react';

import * as authApi from '../api/auth.api';
import { validateRegisterForm } from '../auth.validation';
import { initialRegisterForm } from '../types/auth.types';
import { useAuth } from './useAuth';

import type { RegisterForm } from '../types/auth.types';

export function useRegister() {
  const { setSession } = useAuth();
  const [form, setForm] = useState<RegisterForm>(initialRegisterForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onChangeField(field: keyof RegisterForm, value: string) {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit() {
    const validationError = validateRegisterForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await authApi.register(form);
      await setSession(result);
    } catch (err) {
      setError(
        authApi.getAuthErrorMessage(err) ??
          'No se pudo crear la cuenta. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return { form, error, loading, onChangeField, onSubmit };
}
