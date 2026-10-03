import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import TutorDetailScreen from '@/app/(drawer)/(tabs)/tutors/[id]';
import { getTutorById } from '@/src/features/patients/patients.service';
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
  getTutorById: jest.fn(),
}));

const mockedGetTutorById = jest.mocked(getTutorById);

const tutor: TutorWithPatients = {
  id: 't1',
  firstName: 'Ana',
  lastName: 'Perez',
  region: 'Metropolitana de Santiago',
  comuna: 'Providencia',
  streetAddress: 'Av. Siempre Viva 123',
  addressComplement: 'Depto 45',
  email: null,
  phone: '+56912345678',
  rut: '12345678-5',
  patients: [
    {
      id: 'p1',
      firstName: 'Luna',
      lastName: 'Perez',
      sex: 'FEMALE',
      age: 4,
      speciesId: 's1',
      species: { id: 's1', name: 'Canino' },
      breedId: 'b1',
      breed: { id: 'b1', name: 'Beagle', speciesId: 's1' },
      reproductiveStatus: 'STERILIZED',
      tutorId: 't1',
    },
  ],
};

async function renderScreen() {
  render(
    <PaperProvider>
      <TutorDetailScreen />
    </PaperProvider>
  );
  await screen.findByText('Ana Perez');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetTutorById.mockResolvedValue(tutor);
});

describe('TutorDetailScreen', () => {
  it('muestra los datos del tutor y sus mascotas', async () => {
    await renderScreen();

    expect(mockedGetTutorById).toHaveBeenCalledWith('t1');
    expect(screen.getByText('RUT: 12345678-5')).toBeTruthy();
    expect(screen.getByText('Teléfono: +56912345678')).toBeTruthy();
    expect(screen.getByText('Correo: No registrado')).toBeTruthy();
    expect(
      screen.getByText(
        'Dirección: Av. Siempre Viva 123, Providencia, Metropolitana de Santiago'
      )
    ).toBeTruthy();
    expect(screen.getByText('Complemento: Depto 45')).toBeTruthy();
    expect(screen.getByText('Luna Perez')).toBeTruthy();
    expect(screen.getByText('Especie: Canino')).toBeTruthy();
    expect(screen.getByText('Raza: Beagle')).toBeTruthy();
  });

  it('muestra el estado vacío cuando el tutor no tiene mascotas', async () => {
    mockedGetTutorById.mockResolvedValue({ ...tutor, patients: [] });
    await renderScreen();

    expect(screen.getByText('Sin mascotas registradas')).toBeTruthy();
  });

  it('"Agregar mascota" abre el registro con el tutor preseleccionado', async () => {
    await renderScreen();

    fireEvent.press(screen.getByText('Agregar mascota'));

    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(/^\/patients\/create\?tutorId=t1&refresh=\d+$/)
    );
  });

  it('"Editar" abre la edición del tutor', async () => {
    await renderScreen();

    fireEvent.press(screen.getByText('Editar'));

    expect(router.push).toHaveBeenCalledWith('/tutors/edit?id=t1');
  });

  it('abre la mascota al presionarla', async () => {
    await renderScreen();

    fireEvent.press(screen.getByText('Luna Perez'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/patients/[id]',
      params: { id: 'p1' },
    });
  });

  it('"Ver dirección en Maps" abre Google Maps con la dirección del tutor', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderScreen();

    fireEvent.press(screen.getByText('Ver dirección en Maps'));

    expect(openURL).toHaveBeenCalledWith(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        'Av. Siempre Viva 123, Providencia, Metropolitana de Santiago, Chile'
      )}`
    );
  });
});
