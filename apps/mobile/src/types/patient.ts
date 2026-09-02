export type Tutor = {
  id: string;
  firstName: string;
  lastName: string;
  region: string;
  comuna: string;
  streetAddress: string;
  email?: string | null;
  phone: string;
  rut: string;
};

export type CreateTutorInput = {
  firstName: string;
  lastName: string;
  region: string;
  comuna: string;
  streetAddress: string;
  email?: string;
  phone: string;
  rut: string;
};

export type Region = {
  name: string;
  comunas: string[];
};

export type Consultation = {
  id: string;
  consultationReason: string;
  diagnosis?: string | null;
  consultationDate: string;
};

export type Species = {
  id: string;
  name: string;
};

export type Breed = {
  id: string;
  name: string;
  speciesId: string;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName?: string | null;
  sex: "MALE" | "FEMALE";
  age?: number | null;
  speciesId: string;
  species: Species;
  breedId: string;
  breed: Breed;
  reproductiveStatus: "STERILIZED" | "NOT_STERILIZED";
  tutor: Tutor;
  consultations?: Consultation[];
};

export type CreatePatientInput = {
  firstName: string;
  lastName?: string;
  sex: "MALE" | "FEMALE";
  age?: number;
  speciesId: string;
  breedId: string;
  reproductiveStatus: "STERILIZED" | "NOT_STERILIZED";
  tutorId: string;
};

export type CreatedPatient = Omit<Patient, "tutor" | "consultations"> & {
  tutorId: string;
};

export type TutorWithPatients = Tutor & {
  patients: CreatedPatient[];
};
