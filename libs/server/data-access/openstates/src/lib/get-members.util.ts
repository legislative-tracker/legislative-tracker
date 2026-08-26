import {
  OpenStatesPerson,
  OpenStatesResponse,
} from '@legislative-tracker/shared/models';
import { normalizeJurisdictionForOpenStates } from './openstates.util';

export async function getMembers(
  state: string,
  apiKey: string,
): Promise<OpenStatesPerson[]> {
  const cleanState = normalizeJurisdictionForOpenStates(state);
  const allPeople: OpenStatesPerson[] = [];
  let page = 1;
  let maxPage = 1;

  do {
    const url = new URL('https://v3.openstates.org/people');
    url.searchParams.set('jurisdiction', cleanState);
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('per_page', '50');
    url.searchParams.set('page', page.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `OpenStates API error (${response.status}): ${response.statusText}`,
      );
    }

    const data =
      (await response.json()) as OpenStatesResponse<OpenStatesPerson>;
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid OpenStates API response format');
    }

    allPeople.push(...data.results);

    maxPage = data.pagination?.max_page || page;
    page += 1;
  } while (page <= maxPage);

  return allPeople;
}
