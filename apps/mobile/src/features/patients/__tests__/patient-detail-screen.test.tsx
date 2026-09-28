import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

import PatientDetailScreen from '@/app/(drawer)/(tabs)/patients/[id]';
import { getPatientById } from '@/src/features/patients/patients.service';
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
  getPatientById: jest.fn(),
}));

const mockedGetPatientById = jest.mocked(getPatientById);

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
  consultations: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PatientDetailScreen', () => {
  it('navega al detalle del tutor al presionar "Ver tutor"', async () => {
    mockedGetPatientById.mockResolvedValue(patient);

    render(
      <PaperProvider>
        <PatientDetailScreen />
      </PaperProvider>
    );

    fireEvent.press(await screen.findByText('Ver tutor'));

    expect(mockedGetPatientById).toHaveBeenCalledWith('p1');
    expect(router.push).toHaveBeenCalledWith('/tutors/t1');
  });
});
