import type { Tutor } from '@/src/types/patient';

export function formatTutorAddress(tutor: Tutor): string {
  return `${tutor.streetAddress}, ${tutor.comuna}, ${tutor.region}`;
}

export function buildTutorMapsUrl(tutor: Tutor): string {
  const query = `${tutor.streetAddress}, ${tutor.comuna}, ${tutor.region}, Chile`;
  const encodedQuery = encodeURIComponent(query);

  return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
}
