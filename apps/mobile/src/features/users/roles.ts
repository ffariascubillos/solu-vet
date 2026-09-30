import type { InvitableRole, UserRole } from './types/users.types';

export const roleLabels: Record<UserRole, string> = {
  OWNER: 'Propietario',
  VETERINARIAN: 'Médico veterinario',
  RECEPTIONIST: 'Recepcionista',
  ASSISTANT: 'Asistente / TENS veterinario',
};

export const invitableRoles: InvitableRole[] = ['VETERINARIAN', 'RECEPTIONIST', 'ASSISTANT'];
