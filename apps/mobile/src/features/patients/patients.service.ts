import { api } from "@/src/services/api";
import {
  CreatedPatient,
  CreatePatientInput,
  CreateTutorInput,
  Patient,
  Tutor,
} from "@/src/types/patient";

type SearchPatientsResponse = {
  ok: boolean;
  data: Patient[];
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

export async function createTutor(data: CreateTutorInput) {
  const response = await api.post<CreateTutorResponse>("/tutors", data);

  return response.data.data;
}

export async function createPatient(data: CreatePatientInput) {
  const response = await api.post<CreatePatientResponse>("/patients", data);

  return response.data.data;
}
