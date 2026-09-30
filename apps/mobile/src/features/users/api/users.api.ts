import { api } from '@/src/services/api';

import type { InvitableRole, SeatsData } from '../types/users.types';

type OkResponse = {
  ok: boolean;
  message?: string;
};

type SeatsResponse = {
  ok: boolean;
  data: SeatsData;
};

export async function inviteUser(email: string, role: InvitableRole) {
  const response = await api.post<OkResponse>('/users/invite', { email, role });

  return response.data;
}

export async function getSeats() {
  const response = await api.get<SeatsResponse>('/users/seats');

  return response.data.data;
}

export async function cancelInvitation(id: string) {
  const response = await api.delete<OkResponse>(`/users/invitations/${id}`);

  return response.data;
}

export async function removeUser(id: string) {
  const response = await api.delete<OkResponse>(`/users/${id}`);

  return response.data;
}
