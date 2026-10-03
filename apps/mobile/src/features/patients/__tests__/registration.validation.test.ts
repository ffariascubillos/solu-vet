import type { PatientForm, TutorForm } from '../registration.types';
import {
  isValidRut,
  normalizeRut,
  validatePatientForm,
  validateTutorForm,
} from '../registration.validation';

const validTutorForm: TutorForm = {
  firstName: 'Ana',
  lastName: 'Perez',
  region: 'Metropolitana de Santiago',
  comuna: 'Providencia',
  streetAddress: 'Av. Siempre Viva 123',
  addressComplement: '',
  email: 'ana@example.com',
  phone: '+56912345678',
  rut: '12345678-5',
};

const validPatientForm: PatientForm = {
  firstName: 'Luna',
  sex: 'FEMALE',
  age: '4',
  speciesId: 's1',
  breedId: 'b1',
  reproductiveStatus: 'NOT_STERILIZED',
};

describe('normalizeRut', () => {
  it('quita puntos y espacios y pasa a mayúsculas', () => {
    expect(normalizeRut(' 10.000.030-k ')).toBe('10000030-K');
    expect(normalizeRut('12.345.678-5')).toBe('12345678-5');
  });
});

describe('isValidRut', () => {
  it('acepta RUT con dígito verificador correcto', () => {
    expect(isValidRut('12345678-5')).toBe(true);
    expect(isValidRut('11111111-1')).toBe(true);
    expect(isValidRut('1234567-4')).toBe(true);
    expect(isValidRut('10000004-0')).toBe(true);
  });

  it('acepta dígito verificador K', () => {
    expect(isValidRut('10000030-K')).toBe(true);
  });

  it('rechaza dígito verificador incorrecto', () => {
    expect(isValidRut('12345678-9')).toBe(false);
    expect(isValidRut('10000030-0')).toBe(false);
  });

  it('rechaza RUT sin guión o con puntos si no se normaliza antes', () => {
    expect(isValidRut('123456785')).toBe(false);
    expect(isValidRut('12.345.678-5')).toBe(false);
    expect(isValidRut('10000030-k')).toBe(false);
  });

  it('acepta RUT con puntos y k minúscula una vez normalizado', () => {
    expect(isValidRut(normalizeRut('12.345.678-5'))).toBe(true);
    expect(isValidRut(normalizeRut('10.000.030-k'))).toBe(true);
  });
});

describe('validateTutorForm', () => {
  it('no devuelve error con un formulario válido', () => {
    expect(validateTutorForm(validTutorForm)).toBe('');
  });

  it('acepta RUT con puntos y correo vacío', () => {
    expect(
      validateTutorForm({ ...validTutorForm, rut: '12.345.678-5', email: '' })
    ).toBe('');
  });

  it.each([
    'firstName',
    'lastName',
    'region',
    'comuna',
    'streetAddress',
    'phone',
    'rut',
  ] as const)('exige el campo obligatorio %s', (field) => {
    expect(validateTutorForm({ ...validTutorForm, [field]: '' })).toBe(
      'Completa los datos obligatorios del tutor.'
    );
  });

  it('considera vacío un nombre con solo espacios', () => {
    expect(validateTutorForm({ ...validTutorForm, firstName: '   ' })).toBe(
      'Completa los datos obligatorios del tutor.'
    );
  });

  it('rechaza un correo con formato inválido', () => {
    expect(validateTutorForm({ ...validTutorForm, email: 'ana@' })).toBe(
      'Ingresa un correo electrónico válido.'
    );
  });

  it('rechaza un RUT inválido', () => {
    expect(validateTutorForm({ ...validTutorForm, rut: '12345678-9' })).toBe(
      'Ingresa un RUT válido.'
    );
  });
});

describe('validatePatientForm', () => {
  it('no devuelve error con un formulario válido', () => {
    expect(validatePatientForm(validPatientForm)).toBe('');
  });

  it.each(['firstName', 'speciesId', 'breedId'] as const)(
    'exige el campo obligatorio %s',
    (field) => {
      expect(validatePatientForm({ ...validPatientForm, [field]: '' })).toBe(
        'Completa los datos obligatorios del paciente.'
      );
    }
  );

  it('rechaza una edad que no es entero no negativo', () => {
    expect(validatePatientForm({ ...validPatientForm, age: '-1' })).toBe(
      'La edad debe ser un número entero mayor o igual a cero.'
    );
    expect(validatePatientForm({ ...validPatientForm, age: '2.5' })).toBe(
      'La edad debe ser un número entero mayor o igual a cero.'
    );
  });
});
