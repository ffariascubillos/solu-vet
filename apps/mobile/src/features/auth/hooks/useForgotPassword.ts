import { useState } from 'react';

import { isValidEmail } from '@/src/utils/validation';

import * as authApi from '../api/auth.api';

const SUCCESS_MESSAGE =
  'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.';

export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function onChangeEmail(value: string) {
    setError('');
    setEmail(value);
  }

  async function onSubmit() {
    if (!isValidEmail(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authApi.requestPasswordReset(email.trim());
    } catch {}

    setLoading(false);
    setSuccess(true);
  }

  return {
    email,
    error,
    loading,
    success,
    message: SUCCESS_MESSAGE,
    onChangeEmail,
    onSubmit,
  };
}
