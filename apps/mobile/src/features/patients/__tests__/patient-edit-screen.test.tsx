import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { TextInput } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import EditPatientScreen from '@/app/(drawer)/(tabs)/patients/edit';
import {
  getBreeds,
  getPatientById,
  getSpecies,
  updatePatient,
} from '@/src/features/patients/patients.service';
import type { Patient } from '@/src/types/patient';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'p1' }),
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
  getBreeds: jest.fn(),
  getPatientById: jest.fn(),
  getSpecies: jest.fn(),
  updatePatient: jest.fn(),
}));

const mockedGetBreeds = jest.mocked(getBreeds);
const mockedGetPatientById = jest.mocked(getPatientById);
const mockedGetSpecies = jest.mocked(getSpecies);
const mockedUpdatePatient = jest.mocked(updatePatient);

const patient: Patient = {
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
  tutor: {
    id: 't1',
    firstName: 'Ana',
    lastName: 'Perez',
    region: 'Metropolitana de Santiago',
    comuna: 'Providencia',
    streetAddress: 'Av. Siempre Viva 123',
    phone: '+56912345678',
    rut: '12345678-5',
  },
};

async function renderScreen() {
  render(
    <PaperProvider>
      <EditPatientScreen />
    </PaperProvider>
  );
  await screen.findByText('Editar mascota');
  await screen.findByText('Beagle');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetPatientById.mockResolvedValue(patient);
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

describe('EditPatientScreen', () => {
  it('carga el formulario con los datos de la mascota', async () => {
    await renderScreen();
    const [name, age] = screen.UNSAFE_getAllByType(TextInput);

    expect(mockedGetPatientById).toHaveBeenCalledWith('p1');
    expect(name.props.value).toBe('Luna');
    expect(age.props.value).toBe('4');
    expect(screen.getByText('Canino')).toBeTruthy();
    expect(screen.getByText('Beagle')).toBeTruthy();
    expect(screen.getByText('Ana Perez')).toBeTruthy();
  });

  it('al cambiar la especie limpia la raza y exige elegir una nueva', async () => {
    await renderScreen();

    fireEvent.press(screen.getByText('Canino'));
    fireEvent.press(await screen.findByText('Felino'));

    await waitFor(() => expect(mockedGetBreeds).toHaveBeenCalledWith('s2'));
    expect(await screen.findByText('Selecciona una raza')).toBeTruthy();
    expect(screen.queryByText('Beagle')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText('Completa los datos obligatorios del paciente.')
    ).toBeTruthy();
    expect(mockedUpdatePatient).not.toHaveBeenCalled();
  });

  it('guarda los cambios con updatePatient y vuelve a la ficha', async () => {
    mockedUpdatePatient.mockResolvedValue({
      ...patient,
      speciesId: 's2',
      breedId: 'b2',
      tutorId: 't1',
    });
    await renderScreen();

    fireEvent.press(screen.getByText('Canino'));
    fireEvent.press(await screen.findByText('Felino'));
    await waitFor(() => expect(screen.queryByText('Cargando razas...')).toBeNull());
    fireEvent.press(await screen.findByText('Selecciona una raza'));
    fireEvent.press(await screen.findByText('Siamés'));
    fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(mockedUpdatePatient).toHaveBeenCalledWith('p1', {
        firstName: 'Luna',
        lastName: 'Perez',
        sex: 'FEMALE',
        age: 4,
        speciesId: 's2',
        breedId: 'b2',
        reproductiveStatus: 'STERILIZED',
        tutorId: 't1',
      })
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(/^\/patients\/p1\?refresh=\d+$/)
      )
    );
  });
});
