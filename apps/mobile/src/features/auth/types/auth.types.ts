export type LoginForm = {
  email: string;
  password: string;
};

export const initialLoginForm: LoginForm = {
  email: '',
  password: '',
};

export type OrganizationType = 'INDEPENDENT' | 'CLINIC';

export type RegisterForm = {
  name: string;
  organizationType: OrganizationType;
  clinicName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const initialRegisterForm: RegisterForm = {
  name: '',
  organizationType: 'INDEPENDENT',
  clinicName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AuthOrganization = {
  id: string;
  name: string;
  type: OrganizationType;
  trialEndsAt: string | null;
  subscriptionStatus: string;
};

export type AuthSessionData = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  organization: AuthOrganization;
};
