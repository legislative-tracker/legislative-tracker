import { OpenStatesBill } from '@legislative-tracker/shared/models';
import { DEFAULT_BILL_INCLUDES } from './constants.config';

/**
 * Fetches full details for a bill from OpenStates API v3 using its unique OCD ID.
 *
 * @param billId - Open Civic Data bill identifier (e.g., 'ocd-bill/12345').
 * @param apiKey - OpenStates API key.
 * @param includes - Related sub-resources to expand in response (sponsorships, actions, etc.).
 * @returns Parsed OpenStatesBill payload.
 * @throws Error if the HTTP request fails or response payload is invalid.
 */
export async function getBillByOcdId(
  billId: string,
  apiKey: string,
  includes: string[] = DEFAULT_BILL_INCLUDES,
): Promise<OpenStatesBill> {
  const cleanBillId = billId.replace(/^\//, '');
  const url = new URL(`https://v3.openstates.org/bills/${cleanBillId}`);

  url.searchParams.set('apikey', apiKey);
  for (const inc of includes) {
    url.searchParams.append('include', inc);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `OpenStates API error (${response.status}): ${response.statusText}`,
    );
  }

  const data = (await response.json()) as OpenStatesBill;
  if (!data || typeof data !== 'object' || !data.id) {
    throw new Error('Invalid OpenStates API response format');
  }

  return data;
}
