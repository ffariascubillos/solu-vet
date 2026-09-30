import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001/api';

test('el propietario de una clínica invita a un usuario y lo ve pendiente en Cuenta', async ({
  page,
  request,
}) => {
  const email = `e2e-owner-${randomUUID()}@example.com`;
  const password = 'supersecret123';
  const invitedEmail = `delivered+e2e-${randomUUID()}@resend.dev`;

  const register = await request.post(`${API_URL}/auth/register`, {
    data: {
      organizationType: 'CLINIC',
      email,
      password,
      name: 'Camila Rojas',
      organizationName: 'Clínica E2E',
    },
  });
  expect(register.ok()).toBeTruthy();

  await page.goto('/login');
  await page.getByRole('textbox').nth(0).fill(email);
  await page.getByRole('textbox').nth(1).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('¡Hola, Camila Rojas!')).toBeVisible();

  await page.getByRole('tab', { name: /Cuenta/ }).click();
  await expect(page.getByText('Usuarios de la clínica')).toBeVisible();
  await expect(page.getByText('1 de 5')).toBeVisible();

  await page.getByRole('button', { name: /Invitar usuario/ }).click();
  await expect(page.getByRole('button', { name: 'Enviar invitación' })).toBeVisible();

  await page.getByRole('textbox').fill(invitedEmail);
  await page.getByRole('button', { name: 'Recepcionista' }).click();
  await page.getByRole('button', { name: 'Enviar invitación' }).click();
  await expect(page.getByText('Invitación enviada correctamente.')).toBeVisible();

  await page.getByRole('tab', { name: /Cuenta/ }).click();
  await expect(page.getByText('2 de 5')).toBeVisible();

  const invitedRow = page.getByText(invitedEmail).locator('..');
  await expect(invitedRow.getByText('Recepcionista')).toBeVisible();
  await expect(invitedRow.getByText('Invitación pendiente')).toBeVisible();
});
