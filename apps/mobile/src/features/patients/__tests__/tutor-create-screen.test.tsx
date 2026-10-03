import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';
import { router } from 'expo-router';
import { TextInput } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import CreateTutorScreen from '@/app/(drawer)/(tabs)/tutors/create';
import { createTutor, getRegions } from '@/src/features/patients/patients.service';

jest.mock('@/src/features/patients/patients.service', () => ({
  ...jest.requireActual('@/src/features/patients/patients.service'),
  createTutor: jest.fn(),
  getRegions: jest.fn(),
}));

const mockedCreateTutor = jest.mocked(createTutor);
const mockedGetRegions = jest.mocked(getRegions);

const FIELD = {
  firstName: 0,
  lastName: 1,
  streetAddress: 2,
  addressComplement: 3,
  email: 4,
  phone: 5,
  rut: 6,
} as const;

function conflict(field: 'rut' | 'email', message: string) {
  const config = { headers: new AxiosHeaders() };

  return new AxiosError('fail', undefined, config, null, {
    data: { ok: false, message, field },
    status: 409,
    statusText: '409',
    headers: {},
    config,
  });
}

async function renderScreen() {
  render(
    <PaperProvider>
      <CreateTutorScreen />
    </PaperProvider>
  );
  await act(async () => {});
}

function typeIn(field: keyof typeof FIELD, value: string) {
  fireEvent.changeText(screen.UNSAFE_getAllByType(TextInput)[FIELD[field]], value);
}

async function fillValidForm() {
  typeIn('firstName', 'Ana');
  typeIn('lastName', 'Perez');
  fireEvent.press(screen.getByText('Selecciona una región'));
  fireEvent.press(await screen.findByText('Metropolitana de Santiago'));
  fireEvent.press(screen.getByText('Selecciona una comuna'));
  fireEvent.press(await screen.findByText('Providencia'));
  typeIn('streetAddress', 'Av. Siempre Viva 123');
  typeIn('addressComplement', 'Depto 45');
  typeIn('email', 'ana@example.com');
  typeIn('phone', '+56912345678');
  typeIn('rut', '12.345.678-5');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetRegions.mockResolvedValue([
    { name: 'Metropolitana de Santiago', comunas: ['Providencia', 'Ñuñoa'] },
    { name: 'Valparaíso', comunas: ['Viña del Mar'] },
  ]);
});

describe('CreateTutorScreen', () => {
  it('muestra el error de validación y no llama a la API con el formulario vacío', async () => {
    await renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Registrar tutor' }));

    expect(
      await screen.findByText('Completa los datos obligatorios del tutor.')
    ).toBeTruthy();
    expect(mockedCreateTutor).not.toHaveBeenCalled();
  });

  it('muestra el error de RUT inválido y no llama a la API', async () => {
    await renderScreen();
    await fillValidForm();
    typeIn('rut', '12345678-9');

    fireEvent.press(screen.getByRole('button', { name: 'Registrar tutor' }));

    expect(await screen.findByText('Ingresa un RUT válido.')).toBeTruthy();
    expect(mockedCreateTutor).not.toHaveBeenCalled();
  });

  it('registra el tutor con los datos normalizados y navega a su ficha', async () => {
    mockedCreateTutor.mockResolvedValue({
      id: 't1',
      firstName: 'Ana',
      lastName: 'Perez',
      region: 'Metropolitana de Santiago',
      comuna: 'Providencia',
      streetAddress: 'Av. Siempre Viva 123',
      phone: '+56912345678',
      rut: '12345678-5',
    });
    await renderScreen();
    await fillValidForm();

    fireEvent.press(screen.getByRole('button', { name: 'Registrar tutor' }));

    await waitFor(() =>
      expect(mockedCreateTutor).toHaveBeenCalledWith({
        firstName: 'Ana',
        lastName: 'Perez',
        region: 'Metropolitana de Santiago',
        comuna: 'Providencia',
        streetAddress: 'Av. Siempre Viva 123',
        addressComplement: 'Depto 45',
        email: 'ana@example.com',
        phone: '+56912345678',
        rut: '12345678-5',
      })
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(/^\/tutors\/t1\?refresh=\d+$/)
      )
    );
  });

  it.each([
    ['rut', 'Ya existe un tutor con este RUT.'],
    ['email', 'Ya existe un tutor con este correo.'],
  ] as const)('muestra el error de campo ante un 409 por %s', async (field, message) => {
    mockedCreateTutor.mockRejectedValue(conflict(field, message));
    await renderScreen();
    await fillValidForm();

    fireEvent.press(screen.getByRole('button', { name: 'Registrar tutor' }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
