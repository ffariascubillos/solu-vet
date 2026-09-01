import { create } from 'axios';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL no está definida. Copia apps/mobile/.env.example a apps/mobile/.env y configura la URL de tu backend.'
  );
}

export const api = create({
  baseURL: apiUrl,
  timeout: 10000,
});
