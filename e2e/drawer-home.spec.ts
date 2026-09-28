import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001/api';

test('"Inicio" del drawer lleva a Home desde "Registrar tutor"', async ({ page, request }) => {
  const email = `e2e-drawer-${randomUUID()}@example.com`;
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
  await expect(page.getByRole('tab', { name: /Registrar/ })).toHaveAttribute(
    'aria-selected',
    'true'
  );

  await page.getByRole('button', { name: 'Show navigation menu' }).click();
  await page.getByRole('button', { name: /Inicio/ }).click();

  await expect(page.getByText('¡Hola, Camila Rojas!')).toBeVisible();
  await expect(page.getByRole('tab', { name: /Inicio/ })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});
