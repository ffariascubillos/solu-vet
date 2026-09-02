import type { CreatePatientInput, Patient, Tutor } from '@/src/types/patient';

export type TutorForm = {
  firstName: string;
  lastName: string;
  region: string;
  comuna: string;
  streetAddress: string;
  email: string;
  phone: string;
  rut: string;
};

export type PatientForm = {
  firstName: string;
  sex: CreatePatientInput['sex'];
  age: string;
  speciesId: string;
  breedId: string;
  reproductiveStatus: CreatePatientInput['reproductiveStatus'];
};

export type TutorFieldErrors = Partial<Record<'rut' | 'email', string>>;

export const initialTutorForm: TutorForm = {
  firstName: '',
  lastName: '',
  region: '',
  comuna: '',
  streetAddress: '',
  email: '',
  phone: '',
  rut: '',
};

export const initialPatientForm: PatientForm = {
  firstName: '',
  sex: 'FEMALE',
  age: '',
  speciesId: '',
  breedId: '',
  reproductiveStatus: 'NOT_STERILIZED',
};

export function toTutorFormState(tutor: Tutor): TutorForm {
  return {
    firstName: tutor.firstName,
    lastName: tutor.lastName,
    region: tutor.region,
    comuna: tutor.comuna,
    streetAddress: tutor.streetAddress,
    email: tutor.email ?? '',
    phone: tutor.phone,
    rut: tutor.rut,
  };
}

export function toPatientFormState(patient: Patient): PatientForm {
  return {
    firstName: patient.firstName,
    sex: patient.sex,
    age: patient.age != null ? String(patient.age) : '',
    speciesId: patient.speciesId,
    breedId: patient.breedId,
    reproductiveStatus: patient.reproductiveStatus,
  };
}
