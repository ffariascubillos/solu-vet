import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';
import { router } from 'expo-router';
import { TextInput } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import EditTutorScreen from '@/app/(drawer)/(tabs)/tutors/edit';
import {
  getRegions,
  getTutorById,
  updateTutor,
} from '@/src/features/patients/patients.service';
import type { TutorWithPatients } from '@/src/types/patient';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 't1' }),
}));

jest.mock('@react-navigation/native', () => {
  const { useEffect } = jest.requireActual('react');

  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      useEffect(callback, [callback]);
    },
  };
});

jest.mock('@/src/features/patients/patients.service', () => ({
  ...jest.requireActual('@/src/features/patients/patients.service'),
  getTutorById: jest.fn(),
  getRegions: jest.fn(),
  updateTutor: jest.fn(),
}));

const mockedGetTutorById = jest.mocked(getTutorById);
const mockedGetRegions = jest.mocked(getRegions);
const mockedUpdateTutor = jest.mocked(updateTutor);

const tutor: TutorWithPatients = {
  id: 't1',
  firstName: 'Ana',
  lastName: 'Perez',
  region: 'Metropolitana de Santiago',
  comuna: 'Providencia',
  streetAddress: 'Av. Siempre Viva 123',
  addressComplement: null,
  email: 'ana@example.com',
  phone: '+56912345678',
  rut: '12345678-5',
  patients: [],
};

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
      <EditTutorScreen />
    </PaperProvider>
  );
  await screen.findByText('Editar tutor');

  return screen.UNSAFE_getAllByType(TextInput);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetTutorById.mockResolvedValue(tutor);
  mockedGetRegions.mockResolvedValue([
    { name: 'Metropolitana de Santiago', comunas: ['Providencia', 'Ñuñoa'] },
  ]);
});

describe('EditTutorScreen', () => {
  it('carga el formulario con los datos del tutor', async () => {
    const inputs = await renderScreen();

    expect(mockedGetTutorById).toHaveBeenCalledWith('t1');
    expect(inputs.map((input) => input.props.value)).toEqual([
      'Ana',
      'Perez',
      'Av. Siempre Viva 123',
      '',
      'ana@example.com',
      '+56912345678',
      '12345678-5',
    ]);
    expect(await screen.findByText('Metropolitana de Santiago')).toBeTruthy();
    expect(screen.getByText('Providencia')).toBeTruthy();
  });

  it('guarda los cambios con updateTutor y vuelve a la ficha', async () => {
    mockedUpdateTutor.mockResolvedValue(tutor);
    const inputs = await renderScreen();

    fireEvent.changeText(inputs[5], '+56987654321');
    fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(mockedUpdateTutor).toHaveBeenCalledWith('t1', {
        firstName: 'Ana',
        lastName: 'Perez',
        region: 'Metropolitana de Santiago',
        comuna: 'Providencia',
        streetAddress: 'Av. Siempre Viva 123',
        addressComplement: undefined,
        email: 'ana@example.com',
        phone: '+56987654321',
        rut: '12345678-5',
      })
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(/^\/tutors\/t1\?refresh=\d+$/)
      )
    );
  });

  it('muestra el error de campo ante un 409 por RUT duplicado', async () => {
    mockedUpdateTutor.mockRejectedValue(
      conflict('rut', 'Ya existe un tutor con este RUT.')
    );
    await renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Ya existe un tutor con este RUT.')).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
