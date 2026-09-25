import { useState } from 'react';

import * as authApi from '../api/auth.api';

type ActivateAccountForm = {
  password: string;
  confirmPassword: string;
};

const initialForm: ActivateAccountForm = {
  password: '',
  confirmPassword: '',
};

export function useActivateAccount(token: string | undefined) {
  const [form, setForm] = useState<ActivateAccountForm>(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function onChangeField(field: keyof ActivateAccountForm, value: string) {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    if (form.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (form.password !== form.confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }

    return '';
  }

  async function onSubmit() {
    if (!token) {
      setError('El enlace no es válido o ya expiró.');
      return;
    }

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authApi.activateInvitation(token, form.password);
      setSuccess(true);
    } catch (err) {
      setError(
        authApi.getAuthErrorMessage(err) ??
          'No se pudo activar la cuenta. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return { form, error, loading, success, onChangeField, onSubmit };
}
