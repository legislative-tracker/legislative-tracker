import * as api from "@jpstroud/nys-openlegislation-types";

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
  const url = new URL(`https://legislation.nysenate.gov/api/3/${path}`);
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }
  url.searchParams.set("full", "true");
  url.searchParams.set("limit", "1000");

  console.log(url.toString());
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `NY Senate API request failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
};
