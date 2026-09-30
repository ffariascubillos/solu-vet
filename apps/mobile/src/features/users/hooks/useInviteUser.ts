import { useState } from 'react';

import { getAuthErrorMessage } from '@/src/features/auth/api/auth.api';
import { isValidEmail } from '@/src/utils/validation';

import * as usersApi from '../api/users.api';
import type { InvitableRole } from '../types/users.types';

export function useInviteUser() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function onChangeEmail(value: string) {
    setError('');
    setEmail(value);
  }

  function onChangeRole(value: InvitableRole) {
    setError('');
    setRole(value);
  }

  async function onSubmit() {
    if (!isValidEmail(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!role) {
      setError('Selecciona un cargo.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await usersApi.inviteUser(email.trim(), role);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(
        getAuthErrorMessage(err) ??
          'No se pudo enviar la invitación. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return { email, role, error, loading, success, onChangeEmail, onChangeRole, onSubmit };
}
