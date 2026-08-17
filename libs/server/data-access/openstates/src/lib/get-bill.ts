import { OpenStatesBill } from './models/openstates-bill';

export const DEFAULT_BILL_INCLUDES = [
  'sponsorships',
  'abstracts',
  'other_titles',
  'other_identifiers',
  'actions',
  'sources',
  'documents',
  'versions',
  'votes',
  'related_bills',
];

export async function getBill(
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
