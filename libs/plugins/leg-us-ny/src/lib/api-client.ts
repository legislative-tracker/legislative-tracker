import * as api from '@jpstroud/nys-openlegislation-types';

export const isSuccess = <T>(v: unknown): v is api.APIResponseSuccess<T> => {
  if ((v as api.APIResponseSuccess<T>)?.success === true) return true;
  return false;
};

export const isItemsResponse = <T>(v: unknown): v is api.Items<T> => {
  if ((v as api.Items<T>)?.items) return true;
  return false;
};

export const fetchNYSenateAPI = async <T>(
  path: string,
  apiKey?: string,
): Promise<T> => {
  const envKey = (globalThis as any).process?.env?.['PLUGIN_LEG_US_NY'];
  const keyToUse = apiKey || envKey;
  const url = new URL(`https://legislation.nysenate.gov/api/3/${path}`);
  if (keyToUse) {
    url.searchParams.set('key', keyToUse);
  }
  url.searchParams.set('full', 'true');
  url.searchParams.set('limit', '1000');

  console.log(url.toString());
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `NY Senate API request failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
};
