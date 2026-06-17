import type { PatientForm, TutorForm } from './registration.types';

export function normalizeRut(rut: string) {
  return rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
}

export function isValidRut(rut: string) {
  const match = /^(\d{7,8})-([\dK])$/.exec(rut);

  if (!match) {
    return false;
  }

  const [, body, checkDigit] = match;
  let multiplier = 2;
  let sum = 0;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDigit =
    remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);

  return checkDigit === expectedDigit;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateTutorForm(tutorForm: TutorForm) {
  const normalizedRut = normalizeRut(tutorForm.rut);
  const tutorFirstName = tutorForm.firstName.trim();
  const tutorLastName = tutorForm.lastName.trim();
  const tutorAddress = tutorForm.address.trim();
  const tutorPhone = tutorForm.phone.trim();

  if (
    !tutorFirstName ||
    !tutorLastName ||
    !tutorAddress ||
    !tutorPhone ||
    !tutorForm.rut.trim()
  ) {
    return 'Completa los datos obligatorios del tutor.';
  }

  if (tutorFirstName.length < 2 || tutorLastName.length < 2) {
    return 'El nombre y apellido del tutor deben tener al menos 2 caracteres.';
  }

  if (tutorAddress.length < 5) {
    return 'La dirección del tutor debe tener al menos 5 caracteres.';
  }

  if (tutorPhone.length < 8) {
    return 'El teléfono del tutor debe tener al menos 8 caracteres.';
  }

  if (!isValidRut(normalizedRut)) {
    return 'Ingresa un RUT válido.';
  }

  if (tutorForm.email.trim() && !isValidEmail(tutorForm.email.trim())) {
    return 'Ingresa un correo electrónico válido.';
  }

  return '';
}

export function validatePatientForm(patientForm: PatientForm) {
  const patientFirstName = patientForm.firstName.trim();
  const patientSpecies = patientForm.species.trim();

  if (!patientFirstName || !patientSpecies) {
    return 'Completa los datos obligatorios del paciente.';
  }

  if (patientSpecies.length < 2) {
    return 'La especie del paciente debe tener al menos 2 caracteres.';
  }

  if (patientForm.age.trim()) {
    const age = Number(patientForm.age);

    if (!Number.isInteger(age) || age < 0) {
      return 'La edad debe ser un número entero mayor o igual a cero.';
    }
  }

  return '';
}
