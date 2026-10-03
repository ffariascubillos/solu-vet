import { AxiosError, AxiosHeaders } from 'axios';

import { getTutorRegistrationError } from '../patients.service';

function axiosErrorWith(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };

  return new AxiosError('fail', undefined, config, null, {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  });
}

describe('getTutorRegistrationError', () => {
  it('mapea un 409 por RUT al campo rut', () => {
    const error = axiosErrorWith(409, {
      ok: false,
      message: 'Ya existe un tutor con este RUT.',
      field: 'rut',
    });

    expect(getTutorRegistrationError(error)).toEqual({
      field: 'rut',
      message: 'Ya existe un tutor con este RUT.',
    });
  });

  it('mapea un 409 por correo al campo email', () => {
    const error = axiosErrorWith(409, {
      ok: false,
      message: 'Ya existe un tutor con este correo.',
      field: 'email',
    });

    expect(getTutorRegistrationError(error)).toEqual({
      field: 'email',
      message: 'Ya existe un tutor con este correo.',
    });
  });

  it('devuelve solo el mensaje si el 409 trae otro campo', () => {
    const error = axiosErrorWith(409, {
      ok: false,
      message: 'Conflicto',
      field: 'phone',
    });

    expect(getTutorRegistrationError(error)).toEqual({ message: 'Conflicto' });
  });

  it('devuelve null si no es un 409 o no es un error de axios', () => {
    expect(
      getTutorRegistrationError(axiosErrorWith(400, { ok: false, message: 'x' }))
    ).toBeNull();
    expect(getTutorRegistrationError(new Error('boom'))).toBeNull();
  });
});
