import { useState } from 'react';

import { isValidEmail } from '@/src/utils/validation';

import * as authApi from '../api/auth.api';

export function useInviteUser() {
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
      await authApi.inviteUser(email.trim());
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(
        authApi.getAuthErrorMessage(err) ??
          'No se pudo enviar la invitación. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return { email, error, loading, success, onChangeEmail, onSubmit };
}
