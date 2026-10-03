import type { Tutor } from '@/src/types/patient';

import { buildTutorMapsUrl, formatTutorAddress } from '../tutor-address';

const tutor: Tutor = {
  id: 't1',
  firstName: 'Ana',
  lastName: 'Perez',
  region: 'Metropolitana de Santiago',
  comuna: 'Providencia',
  streetAddress: 'Av. Siempre Viva 123',
  addressComplement: 'Depto 45',
  phone: '+56912345678',
  rut: '12345678-5',
};

describe('formatTutorAddress', () => {
  it('une calle, comuna y región sin el complemento', () => {
    const address = formatTutorAddress(tutor);

    expect(address).toBe(
      'Av. Siempre Viva 123, Providencia, Metropolitana de Santiago'
    );
    expect(address).not.toContain('Depto 45');
  });
});

describe('buildTutorMapsUrl', () => {
  it('busca calle, comuna, región y Chile sin el complemento', () => {
    const url = buildTutorMapsUrl(tutor);
    const query = new URL(url).searchParams.get('query');

    expect(url.startsWith('https://www.google.com/maps/search/?api=1&query=')).toBe(
      true
    );
    expect(query).toBe(
      'Av. Siempre Viva 123, Providencia, Metropolitana de Santiago, Chile'
    );
    expect(url).not.toContain('Depto');
  });
});
