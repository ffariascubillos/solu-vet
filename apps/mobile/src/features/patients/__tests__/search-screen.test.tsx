import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

import SearchPatientScreen from '@/app/(drawer)/(tabs)/patients/search';
import {
  searchPatients,
  searchTutors,
} from '@/src/features/patients/patients.service';
import type { Patient, TutorWithPatients } from '@/src/types/patient';

jest.mock('@/src/features/patients/patients.service', () => ({
  searchPatients: jest.fn(),
  searchTutors: jest.fn(),
}));

const mockedSearchPatients = jest.mocked(searchPatients);
const mockedSearchTutors = jest.mocked(searchTutors);

const tutor: TutorWithPatients = {
  id: 't1',
  firstName: 'Ana',
  lastName: 'Perez',
  region: 'Metropolitana de Santiago',
  comuna: 'Providencia',
  streetAddress: 'Av. Siempre Viva 123',
  email: 'ana@example.com',
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

const patient: Patient = {
  ...tutor.patients[0],
  tutor,
};

function renderScreen() {
  render(
    <PaperProvider>
      <SearchPatientScreen />
    </PaperProvider>
  );
}

function search(placeholder: string, query: string) {
  fireEvent.changeText(screen.getByPlaceholderText(placeholder), query);
  fireEvent.press(screen.getByRole('button', { name: 'Buscar' }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SearchPatientScreen en modo Paciente', () => {
  it('muestra los pacientes encontrados y abre su ficha', async () => {
    mockedSearchPatients.mockResolvedValue([patient]);
    renderScreen();

    search('Nombre o apellido del paciente', ' Luna ');

    fireEvent.press(await screen.findByText('Luna Perez'));
    expect(mockedSearchPatients).toHaveBeenCalledWith('Luna');
    expect(screen.getByText('Tutor: Ana Perez')).toBeTruthy();
    expect(screen.getByText('Especie: Canino')).toBeTruthy();
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/patients/[id]',
      params: { id: 'p1' },
    });
  });

  it('muestra el estado vacío cuando no hay resultados', async () => {
    mockedSearchPatients.mockResolvedValue([]);
    renderScreen();

    search('Nombre o apellido del paciente', 'Nadie');

    expect(await screen.findByText('No encontramos pacientes')).toBeTruthy();
    fireEvent.press(screen.getByText('Registrar tutor'));
    expect(router.push).toHaveBeenCalledWith('/tutors/create');
  });

  it('muestra el error y permite reintentar la búsqueda', async () => {
    mockedSearchPatients
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([patient]);
    renderScreen();

    search('Nombre o apellido del paciente', 'Luna');

    expect(
      await screen.findByText(
        'No se pudo completar la búsqueda. Revisa la conexión e intenta nuevamente.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Reintentar'));

    expect(await screen.findByText('Luna Perez')).toBeTruthy();
    expect(mockedSearchPatients).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByText(
        'No se pudo completar la búsqueda. Revisa la conexión e intenta nuevamente.'
      )
    ).toBeNull();
  });
});

describe('SearchPatientScreen en modo Tutor', () => {
  it('muestra los tutores encontrados con sus mascotas', async () => {
    mockedSearchTutors.mockResolvedValue([tutor]);
    renderScreen();

    fireEvent.press(screen.getByText('Tutor'));
    search('Nombre, apellido o RUT del tutor', '12345678-5');

    expect(await screen.findByText('Ana Perez')).toBeTruthy();
    expect(mockedSearchTutors).toHaveBeenCalledWith('12345678-5');
    expect(mockedSearchPatients).not.toHaveBeenCalled();
    expect(screen.getByText('RUT: 12345678-5')).toBeTruthy();
    expect(screen.getByText('Luna Perez')).toBeTruthy();

    fireEvent.press(screen.getByText('Ver ficha del tutor'));
    expect(router.push).toHaveBeenCalledWith('/tutors/t1');
  });

  it('muestra el estado vacío cuando no hay tutores', async () => {
    mockedSearchTutors.mockResolvedValue([]);
    renderScreen();

    fireEvent.press(screen.getByText('Tutor'));
    search('Nombre, apellido o RUT del tutor', 'Nadie');

    expect(await screen.findByText('No encontramos tutores')).toBeTruthy();
  });

  it('muestra el error y permite reintentar la búsqueda', async () => {
    mockedSearchTutors
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([tutor]);
    renderScreen();

    fireEvent.press(screen.getByText('Tutor'));
    search('Nombre, apellido o RUT del tutor', 'Ana');

    fireEvent.press(await screen.findByText('Reintentar'));

    expect(await screen.findByText('Ana Perez')).toBeTruthy();
    expect(mockedSearchTutors).toHaveBeenCalledTimes(2);
  });
});
