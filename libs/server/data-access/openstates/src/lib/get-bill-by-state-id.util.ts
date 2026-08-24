import { OpenStatesBill } from '@legislative-tracker/shared/models';
import { DEFAULT_BILL_INCLUDES } from './constants.config';
import { normalizeJurisdictionForOpenStates } from './openstates.util';

export async function getBillByStateId(
  state: string,
  session: string,
  billId: string,
  apiKey: string,
  includes: string[] = DEFAULT_BILL_INCLUDES,
): Promise<OpenStatesBill> {
  if (!state || !state.trim()) {
    throw new Error('State/jurisdiction is required');
  }
  if (!session || !session.trim()) {
    throw new Error('Session is required');
  }
  if (!billId || !billId.trim()) {
    throw new Error('Bill ID is required');
  }
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is required');
  }

  const cleanState = normalizeJurisdictionForOpenStates(state);
  const cleanSession = session.trim();
  const cleanBillId = billId.trim();

  const url = new URL(
    `https://v3.openstates.org/bills/${encodeURIComponent(cleanState)}/${encodeURIComponent(cleanSession)}/${encodeURIComponent(cleanBillId)}`,
  );

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
