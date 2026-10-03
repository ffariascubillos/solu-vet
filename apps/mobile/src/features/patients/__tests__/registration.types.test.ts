import type { Patient, Tutor } from '@/src/types/patient';

import { toPatientFormState, toTutorFormState } from '../registration.types';

const tutor: Tutor = {
  id: 't1',
  firstName: 'Ana',
  lastName: 'Perez',
  region: 'Metropolitana de Santiago',
  comuna: 'Providencia',
  streetAddress: 'Av. Siempre Viva 123',
  addressComplement: 'Depto 45',
  email: 'ana@example.com',
  phone: '+56912345678',
  rut: '12345678-5',
};

const patient: Patient = {
  id: 'p1',
  firstName: 'Luna',
  lastName: 'Perez',
  sex: 'MALE',
  age: 4,
  speciesId: 's1',
  species: { id: 's1', name: 'Canino' },
  breedId: 'b1',
  breed: { id: 'b1', name: 'Beagle', speciesId: 's1' },
  reproductiveStatus: 'STERILIZED',
  tutor,
};

describe('toTutorFormState', () => {
  it('copia los datos del tutor al formulario', () => {
    expect(toTutorFormState(tutor)).toEqual({
      firstName: 'Ana',
      lastName: 'Perez',
      region: 'Metropolitana de Santiago',
      comuna: 'Providencia',
      streetAddress: 'Av. Siempre Viva 123',
      addressComplement: 'Depto 45',
      email: 'ana@example.com',
      phone: '+56912345678',
      rut: '12345678-5',
    });
  });

  it('convierte complemento y correo nulos en texto vacío', () => {
    const form = toTutorFormState({
      ...tutor,
      addressComplement: null,
      email: null,
    });

    expect(form.addressComplement).toBe('');
    expect(form.email).toBe('');
  });
});

describe('toPatientFormState', () => {
  it('copia los datos del paciente al formulario con la edad como texto', () => {
    expect(toPatientFormState(patient)).toEqual({
      firstName: 'Luna',
      sex: 'MALE',
      age: '4',
      speciesId: 's1',
      breedId: 'b1',
      reproductiveStatus: 'STERILIZED',
    });
  });

  it('deja la edad vacía cuando es nula y conserva la edad 0', () => {
    expect(toPatientFormState({ ...patient, age: null }).age).toBe('');
    expect(toPatientFormState({ ...patient, age: 0 }).age).toBe('0');
  });
});
