import { get } from './client';

export type CountryOption = { countryCode: string; name: string; dialCode: string };
let cached: CountryOption[] | null = null;

export async function countries() {
  if (!cached) cached = await get<CountryOption[]>('/countries');
  return cached;
}
