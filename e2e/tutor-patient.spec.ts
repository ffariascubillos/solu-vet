import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001/api';

test('registra un tutor, le agrega una mascota y la ve en la ficha del tutor', async ({
  page,
  request,
}) => {
  const email = `e2e-tutor-${randomUUID()}@example.com`;
  const password = 'supersecret123';

  const register = await request.post(`${API_URL}/auth/register`, {
    data: { organizationType: 'INDEPENDENT', email, password, name: 'Camila Rojas' },
  });
  expect(register.ok()).toBeTruthy();

  await page.goto('/login');
  await page.getByRole('textbox').nth(0).fill(email);
  await page.getByRole('textbox').nth(1).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('¡Hola, Camila Rojas!')).toBeVisible();

  await page.getByText('Registrar tutor').click();
  await expect(page.getByText('Crea la ficha del tutor')).toBeVisible();

  const tutorInputs = page.getByRole('textbox');
  await tutorInputs.nth(0).fill('Ana');
  await tutorInputs.nth(1).fill('Pérez');
  await page.getByText('Selecciona una región', { exact: true }).click();
  await page.getByRole('menuitem', { name: 'Metropolitana de Santiago' }).click();
  await page.getByText('Selecciona una comuna').click();
  await page.getByRole('menuitem', { name: 'Providencia', exact: true }).click();
  await tutorInputs.nth(2).fill('Av. Providencia 1234');
  await tutorInputs.nth(4).fill(`ana-${randomUUID()}@example.com`);
  await tutorInputs.nth(5).fill('+56912345678');
  await tutorInputs.nth(6).fill('12.345.678-5');
  await page.getByRole('button', { name: 'Registrar tutor' }).click();

  await expect(page.getByText('Ana Pérez', { exact: true })).toBeVisible();
  await expect(page.getByText('RUT: 12345678-5')).toBeVisible();
  await expect(page.getByText('Sin mascotas registradas')).toBeVisible();

  await page.getByRole('button', { name: 'Agregar mascota' }).click();
  await expect(page.getByText('Tutor seleccionado', { exact: true })).toBeVisible();

  await page.getByRole('textbox').nth(0).fill('Luna');
  await page.getByText('Selecciona una especie', { exact: true }).click();
  await page.getByRole('menuitem', { name: 'Canino' }).click();
  await page.getByText('Selecciona una raza').click();
  await page.getByRole('menuitem', { name: 'Beagle' }).click();
  await page.getByRole('button', { name: 'Registrar mascota' }).click();

  await expect(page.getByText('Luna Pérez')).toBeVisible();
  await expect(page.getByText('Especie: Canino')).toBeVisible();
  await expect(page.getByText('Raza: Beagle')).toBeVisible();
  await expect(page.getByText('Sin mascotas registradas')).toBeHidden();
});
