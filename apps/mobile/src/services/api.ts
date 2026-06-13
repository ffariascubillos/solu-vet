import { create } from 'axios';

// Ipv4 Leslita
// const ipv4 = '192.168.1.86';
// Ipv4 Casa
const ipv4 = '192.168.1.81';

export const api = create({
  baseURL: `http://${ipv4}:3001/api`,
  timeout: 10000,
});
