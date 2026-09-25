import { useState } from 'react';

import * as authApi from '../api/auth.api';

type ResetPasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

const initialForm: ResetPasswordForm = {
  newPassword: '',
  confirmPassword: '',
};

export function useResetPassword(token: string | undefined) {
  const [form, setForm] = useState<ResetPasswordForm>(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function onChangeField(field: keyof ResetPasswordForm, value: string) {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    if (form.newPassword.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (form.newPassword !== form.confirmPassword) {
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
      await authApi.confirmPasswordReset(token, form.newPassword);
      setSuccess(true);
    } catch (err) {
      setError(
        authApi.getAuthErrorMessage(err) ??
          'No se pudo restablecer la contraseña. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return { form, error, loading, success, onChangeField, onSubmit };
}
