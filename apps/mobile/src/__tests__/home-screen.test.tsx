import { act, render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

import HomeScreen from '@/app/(drawer)/(tabs)/index';
import { useAuth } from '@/src/features/auth/hooks/useAuth';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/src/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);

async function renderHome(name: string | undefined) {
  mockedUseAuth.mockReturnValue({
    user: { id: 'u1', email: 'camila@example.com', name, role: 'OWNER' },
  } as unknown as ReturnType<typeof useAuth>);

  render(
    <PaperProvider>
      <HomeScreen />
    </PaperProvider>
  );
  await act(async () => {});
}

describe('HomeScreen', () => {
  it('saluda al usuario por su nombre', async () => {
    await renderHome('Camila Rojas');

    expect(screen.getByText('¡Hola, Camila Rojas!')).toBeTruthy();
  });

  it.each([
    ['vacío', ''],
    ['ausente', undefined],
  ])('muestra un saludo sin nombre cuando el nombre está %s', async (_label, name) => {
    await renderHome(name);

    expect(screen.getByText('¡Hola!')).toBeTruthy();
    expect(screen.queryByText(/¡Hola,/)).toBeNull();
  });
});
