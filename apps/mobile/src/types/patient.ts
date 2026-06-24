export type Tutor = {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  email?: string | null;
  phone: string;
  rut: string;
};

export type CreateTutorInput = {
  firstName: string;
  lastName: string;
  address: string;
  email?: string;
  phone: string;
  rut: string;
};

export type Consultation = {
  id: string;
  consultationReason: string;
  diagnosis?: string | null;
  consultationDate: string;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName?: string | null;
  sex: "MALE" | "FEMALE";
  age?: number | null;
  species: string;
  breed?: string | null;
  reproductiveStatus: "STERILIZED" | "NOT_STERILIZED";
  tutor: Tutor;
  consultations?: Consultation[];
};

export type CreatePatientInput = {
  firstName: string;
  lastName?: string;
  sex: "MALE" | "FEMALE";
  age?: number;
  species: string;
  breed?: string;
  reproductiveStatus: "STERILIZED" | "NOT_STERILIZED";
  tutorId: string;
};

export type CreatedPatient = Omit<Patient, "tutor" | "consultations"> & {
  tutorId: string;
};

export type TutorWithPatients = Tutor & {
  patients: CreatedPatient[];
};
