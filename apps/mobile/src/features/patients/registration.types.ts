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
  species: string;
  breed: string;
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
  species: '',
  breed: '',
  reproductiveStatus: 'NOT_STERILIZED',
};
