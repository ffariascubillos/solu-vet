export type UserRole = 'OWNER' | 'VETERINARIAN' | 'RECEPTIONIST' | 'ASSISTANT';

export type InvitableRole = Exclude<UserRole, 'OWNER'>;

export type Seat = {
  id: string;
  kind: 'USER' | 'INVITATION';
  name: string | null;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING';
};

export type SeatsData = {
  limit: number;
  seats: Seat[];
};
