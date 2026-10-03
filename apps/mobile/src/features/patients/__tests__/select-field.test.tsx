import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

import { SelectField } from '@/src/features/patients/components/SelectField';

const options = [
  { value: 's1', label: 'Canino' },
  { value: 's2', label: 'Felino' },
];

function renderField(props: { disabled?: boolean } = {}) {
  const onSelect = jest.fn();

  render(
    <PaperProvider>
      <SelectField
        label="Especie"
        value=""
        placeholder="Selecciona una especie"
        options={options}
        onSelect={onSelect}
        {...props}
      />
    </PaperProvider>
  );

  return onSelect;
}

async function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += 50) {
    await act(async () => {
      jest.advanceTimersByTime(50);
    });
  }
}

async function press(text: string) {
  fireEvent.press(screen.getByText(text));
  await act(async () => {});
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SelectField', () => {
  it('abre el menú al tocarlo justo después de montarse y lo mantiene abierto', async () => {
    renderField();

    await press('Selecciona una especie');
    await advance(1000);

    expect(screen.getByText('Canino')).toBeTruthy();
    expect(screen.getByText('Felino')).toBeTruthy();
  });

  it('llama a onSelect al elegir una opción y cierra el menú', async () => {
    const onSelect = renderField();
    await advance(1000);

    await press('Selecciona una especie');
    await advance(1000);
    await press('Felino');
    await advance(1000);

    expect(onSelect).toHaveBeenCalledWith('s2');
    expect(screen.queryByText('Felino')).toBeNull();
  });

  it('se vuelve a abrir si se toca de nuevo mientras se está cerrando', async () => {
    renderField();
    await advance(1000);

    await press('Selecciona una especie');
    await advance(1000);
    await press('Canino');
    await press('Selecciona una especie');
    await advance(1000);

    expect(screen.getByText('Canino')).toBeTruthy();
    expect(screen.getByText('Felino')).toBeTruthy();
  });

  it('no abre el menú si está deshabilitado', async () => {
    const onSelect = renderField({ disabled: true });
    await advance(1000);

    await press('Selecciona una especie');
    await advance(1000);

    expect(screen.queryByText('Canino')).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
