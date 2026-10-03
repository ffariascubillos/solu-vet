import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { TextInput } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import CreatePatientScreen from '@/app/(drawer)/(tabs)/patients/create';
import {
  createPatient,
  getBreeds,
  getSpecies,
  getTutorById,
} from '@/src/features/patients/patients.service';
import type { TutorWithPatients } from '@/src/types/patient';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ tutorId: 't1' }),
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
  createPatient: jest.fn(),
  getBreeds: jest.fn(),
  getSpecies: jest.fn(),
  getTutorById: jest.fn(),
}));

const mockedCreatePatient = jest.mocked(createPatient);
const mockedGetBreeds = jest.mocked(getBreeds);
const mockedGetSpecies = jest.mocked(getSpecies);
const mockedGetTutorById = jest.mocked(getTutorById);

const tutor: TutorWithPatients = {
  id: 't1',
  firstName: 'Ana',
  lastName: 'Perez',
  region: 'Metropolitana de Santiago',
  comuna: 'Providencia',
  streetAddress: 'Av. Siempre Viva 123',
  phone: '+56912345678',
  rut: '12345678-5',
  patients: [],
};

async function renderScreen() {
  render(
    <PaperProvider>
      <CreatePatientScreen />
    </PaperProvider>
  );
  await screen.findByText('Tutor seleccionado');
}

async function waitForBreedsLoaded() {
  await waitFor(() => expect(screen.queryByText('Cargando razas...')).toBeNull());
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetTutorById.mockResolvedValue(tutor);
  mockedGetSpecies.mockResolvedValue([
    { id: 's1', name: 'Canino' },
    { id: 's2', name: 'Felino' },
  ]);
  mockedGetBreeds.mockImplementation(async (speciesId) =>
    speciesId === 's1'
      ? [{ id: 'b1', name: 'Beagle', speciesId: 's1' }]
      : [{ id: 'b2', name: 'Siamés', speciesId: 's2' }]
  );
});

describe('CreatePatientScreen', () => {
  it('muestra el tutor preseleccionado', async () => {
    await renderScreen();

    expect(mockedGetTutorById).toHaveBeenCalledWith('t1');
    expect(screen.getByText('Ana Perez')).toBeTruthy();
    expect(screen.getByText('RUT 12345678-5')).toBeTruthy();
  });

  it('carga las razas de la especie elegida y registra la mascota con el tutorId', async () => {
    mockedCreatePatient.mockResolvedValue({
      id: 'p1',
      firstName: 'Luna',
      lastName: 'Perez',
      sex: 'MALE',
      age: 4,
      speciesId: 's1',
      species: { id: 's1', name: 'Canino' },
      breedId: 'b1',
      breed: { id: 'b1', name: 'Beagle', speciesId: 's1' },
      reproductiveStatus: 'STERILIZED',
      tutorId: 't1',
    });
    await renderScreen();
    const [name, age] = screen.UNSAFE_getAllByType(TextInput);

    fireEvent.changeText(name, 'Luna');
    fireEvent.changeText(age, '4');
    fireEvent.press(screen.getByText('Macho'));
    fireEvent.press(screen.getByText('Esterilizado'));

    fireEvent.press(await screen.findByText('Selecciona una especie'));
    fireEvent.press(await screen.findByText('Canino'));
    await waitFor(() => expect(mockedGetBreeds).toHaveBeenCalledWith('s1'));
    await waitForBreedsLoaded();

    fireEvent.press(await screen.findByText('Selecciona una raza'));
    fireEvent.press(await screen.findByText('Beagle'));
    fireEvent.press(screen.getByRole('button', { name: 'Registrar mascota' }));

    await waitFor(() =>
      expect(mockedCreatePatient).toHaveBeenCalledWith({
        firstName: 'Luna',
        lastName: 'Perez',
        sex: 'MALE',
        age: 4,
        speciesId: 's1',
        breedId: 'b1',
        reproductiveStatus: 'STERILIZED',
        tutorId: 't1',
      })
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(/^\/tutors\/t1\?refresh=\d+$/)
      )
    );
  });

  it('muestra el error de validación y no llama a la API sin especie ni raza', async () => {
    await renderScreen();
    const [name] = screen.UNSAFE_getAllByType(TextInput);

    fireEvent.changeText(name, 'Luna');
    fireEvent.press(screen.getByRole('button', { name: 'Registrar mascota' }));

    expect(
      await screen.findByText('Completa los datos obligatorios del paciente.')
    ).toBeTruthy();
    expect(mockedCreatePatient).not.toHaveBeenCalled();
  });
});
