import type { CreatePatientInput } from '@/src/types/patient';

export type TutorForm = {
  firstName: string;
  lastName: string;
  address: string;
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
  address: '',
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
