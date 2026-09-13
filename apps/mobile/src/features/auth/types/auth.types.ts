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
