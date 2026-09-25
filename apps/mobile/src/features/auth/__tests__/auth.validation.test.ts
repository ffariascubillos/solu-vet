import { validateLoginForm, validateRegisterForm } from '../auth.validation';
import { initialRegisterForm } from '../types/auth.types';

import type { RegisterForm } from '../types/auth.types';

const validRegister: RegisterForm = {
  ...initialRegisterForm,
  name: 'Ana Pérez',
  email: 'ana@example.com',
  password: 'password123',
  confirmPassword: 'password123',
};

describe('validateLoginForm', () => {
  it('rechaza campos vacíos', () => {
    expect(validateLoginForm({ email: '', password: '' })).toBe(
      'Completa tu correo electrónico y contraseña.'
    );
    expect(validateLoginForm({ email: 'a@b.cl', password: '  ' })).toBe(
      'Completa tu correo electrónico y contraseña.'
    );
  });

  it('rechaza un email inválido', () => {
    expect(validateLoginForm({ email: 'no-es-email', password: 'x' })).toBe(
      'Ingresa un correo electrónico válido.'
    );
  });

  it('acepta credenciales válidas', () => {
    expect(validateLoginForm({ email: 'ana@example.com', password: 'x' })).toBe('');
  });
});

describe('validateRegisterForm', () => {
  it('rechaza campos obligatorios vacíos', () => {
    expect(validateRegisterForm(initialRegisterForm)).toBe(
      'Completa los datos obligatorios.'
    );
  });

  it('rechaza una clínica sin nombre', () => {
    expect(
      validateRegisterForm({ ...validRegister, organizationType: 'CLINIC' })
    ).toBe('Ingresa el nombre de la clínica.');
  });

  it('rechaza un email inválido', () => {
    expect(validateRegisterForm({ ...validRegister, email: 'ana@' })).toBe(
      'Ingresa un correo electrónico válido.'
    );
  });

  it('rechaza una contraseña corta', () => {
    expect(
      validateRegisterForm({
        ...validRegister,
        password: '1234567',
        confirmPassword: '1234567',
      })
    ).toBe('La contraseña debe tener al menos 8 caracteres.');
  });

  it('rechaza contraseñas distintas', () => {
    expect(
      validateRegisterForm({ ...validRegister, confirmPassword: 'otra-clave-1' })
    ).toBe('Las contraseñas no coinciden.');
  });

  it('acepta un registro independiente válido', () => {
    expect(validateRegisterForm(validRegister)).toBe('');
  });

  it('acepta un registro de clínica válido', () => {
    expect(
      validateRegisterForm({
        ...validRegister,
        organizationType: 'CLINIC',
        clinicName: 'Clínica Sur',
      })
    ).toBe('');
  });
});
