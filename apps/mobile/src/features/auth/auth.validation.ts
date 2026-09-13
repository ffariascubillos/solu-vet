import { isValidEmail } from '../../utils/validation';

import type { LoginForm, RegisterForm } from './types/auth.types';

export function validateLoginForm(form: LoginForm): string {
  if (!form.email.trim() || !form.password.trim()) {
    return 'Completa tu correo electrónico y contraseña.';
  }

  if (!isValidEmail(form.email.trim())) {
    return 'Ingresa un correo electrónico válido.';
  }

  return '';
}

export function validateRegisterForm(form: RegisterForm): string {
  if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
    return 'Completa los datos obligatorios.';
  }

  if (form.organizationType === 'CLINIC' && !form.clinicName.trim()) {
    return 'Ingresa el nombre de la clínica.';
  }

  if (!isValidEmail(form.email.trim())) {
    return 'Ingresa un correo electrónico válido.';
  }

  if (form.password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (form.password !== form.confirmPassword) {
    return 'Las contraseñas no coinciden.';
  }

  return '';
}
