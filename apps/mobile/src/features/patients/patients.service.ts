import { api } from "@/src/services/api";
import { isAxiosError } from "axios";
import {
  Breed,
  CreatedPatient,
  CreatePatientInput,
  CreateTutorInput,
  Patient,
  Region,
  Species,
  Tutor,
  TutorWithPatients,
} from "@/src/types/patient";

type SearchPatientsResponse = {
  ok: boolean;
  data: Patient[];
};

type SearchTutorsResponse = {
  ok: boolean;
  data: TutorWithPatients[];
};

type GetTutorResponse = {
  ok: boolean;
  data: TutorWithPatients;
};

type GetPatientResponse = {
  ok: boolean;
  data: Patient;
};

type CreateTutorResponse = {
  ok: boolean;
  data: Tutor;
};

type CreatePatientResponse = {
  ok: boolean;
  data: CreatedPatient;
};

type GetSpeciesResponse = {
  ok: boolean;
  data: Species[];
};

type GetBreedsResponse = {
  ok: boolean;
  data: Breed[];
};

type GetRegionsResponse = {
  ok: boolean;
  data: Region[];
};

type ApiErrorResponse = {
  ok: false;
  field?: string;
  message?: string;
};

export async function searchPatients(query: string) {
  const response = await api.get<SearchPatientsResponse>("/patients/search", {
    params: {
      q: query,
    },
  });

  return response.data.data;
}

export async function getPatientById(id: string) {
  const response = await api.get<GetPatientResponse>(`/patients/${id}`);

  return response.data.data;
}

export async function searchTutors(query: string) {
  const response = await api.get<SearchTutorsResponse>("/tutors/search", {
    params: {
      q: query,
    },
  });

  return response.data.data;
}

export async function getTutorById(id: string) {
  const response = await api.get<GetTutorResponse>(`/tutors/${id}`);

  return response.data.data;
}

export async function createTutor(data: CreateTutorInput) {
  const response = await api.post<CreateTutorResponse>("/tutors", data);

  return response.data.data;
}

export async function createPatient(data: CreatePatientInput) {
  const response = await api.post<CreatePatientResponse>("/patients", data);

  return response.data.data;
}

type UpdateTutorResponse = {
  ok: boolean;
  data: Tutor;
};

type UpdatePatientResponse = {
  ok: boolean;
  data: CreatedPatient;
};

export async function updateTutor(id: string, data: CreateTutorInput) {
  const response = await api.put<UpdateTutorResponse>(`/tutors/${id}`, data);

  return response.data.data;
}

export async function updatePatient(id: string, data: CreatePatientInput) {
  const response = await api.put<UpdatePatientResponse>(
    `/patients/${id}`,
    data,
  );

  return response.data.data;
}

export async function getSpecies() {
  const response = await api.get<GetSpeciesResponse>("/species");

  return response.data.data;
}

export async function getBreeds(speciesId: string) {
  const response = await api.get<GetBreedsResponse>("/breeds", {
    params: { speciesId },
  });

  return response.data.data;
}

export async function getRegions() {
  const response = await api.get<GetRegionsResponse>("/regions");

  return response.data.data;
}

export type TutorRegistrationError = {
  field?: "rut" | "email";
  message: string;
};

export function getTutorRegistrationError(
  error: unknown,
): TutorRegistrationError | null {
  if (!isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data as ApiErrorResponse | undefined;

  if (error.response?.status !== 409 || !data?.message) {
    return null;
  }

  if (data.field === "rut" || data.field === "email") {
    return {
      field: data.field,
      message: data.message,
    };
  }

  return {
    message: data.message,
  };
}
