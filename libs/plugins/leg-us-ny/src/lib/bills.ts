import * as api from '@jpstroud/nys-openlegislation-types';
import { Legislation, Cosponsor } from '@legislative-tracker/shared/models';
import { NY_JURISDICTION, NY_SENATE_ORG, NY_ASSEMBLY_ORG } from './constants';
import { fetchNYSenateAPI, isSuccess, isItemsResponse } from './api-client';

export const mapCosponsorsToSponsorships = (b: api.Bill) => {
  const activeVer = b.activeVersion;
  if (!b.amendments.items[activeVer]) return [];

  return b.amendments.items[activeVer].coSponsors.items.map(
    (c: api.Member) => ({
      id: c.fullName.replaceAll('.', '').replaceAll(' ', '-'),
      name: c.fullName,
      entity_type: 'person' as const,
      primary: false,
      classification: 'cosponsor',
    }),
  );
};

export const getCosponsors = (b: api.Bill): { [key: string]: Cosponsor[] } => {
  const cosponsorsByVersion: { [key: string]: Cosponsor[] } = {};
  const amendmentVersions: string[] = b.amendmentVersions.items;

  amendmentVersions.forEach((v: string) => {
    const cosponsors: Cosponsor[] = [];

    if (b.amendments.items[v] && b.amendments.items[v].coSponsors) {
      b.amendments.items[v].coSponsors.items.forEach((c: api.Member) =>
        cosponsors.push({
          id: c.fullName.replaceAll('.', '').replaceAll(' ', '-'),
          name: c.fullName,
          chamber: c.chamber,
          district: `${c.districtCode}`,
        }),
      );
    }
    cosponsorsByVersion[v === '' ? 'Original' : v] = cosponsors;
  });

  return cosponsorsByVersion;
};

export const mapAPIBillToLegislation = (b: api.Bill): Legislation => {
  const now = new Date().toISOString();

  const fromOrg =
    b.billType.chamber === 'SENATE' ? NY_SENATE_ORG : NY_ASSEMBLY_ORG;

  const legislation: Legislation = {
    id: b.basePrintNoStr,
    session: `${b.session}`,
    identifier: b.printNo,
    title: b.title,
    jurisdiction: NY_JURISDICTION,
    from_organization: fromOrg,
    classification: ['bill'],
    subject: [],
    extras: {},
    created_at: b.publishedDateTime,
    updated_at: now,
    openstates_url: '',
    first_action_date: b.publishedDateTime.substring(0, 10),
    latest_action_date: b.status.actionDate,
    latest_action_description: b.status.statusDesc,
    latest_passage_date: '',

    actions: [],
    versions: [],
    documents: [],

    sponsorships: mapCosponsorsToSponsorships(b),

    current_version: b.activeVersion,
    text: b.summary,
    cosponsors: getCosponsors(b),
  };

  return legislation;
};

import { PluginConfig } from '@legislative-tracker/plugins-core';

export const updateBills = async (
  billList: string[],
  apiKey?: string,
  config?: PluginConfig,
): Promise<Legislation[]> => {
  const batchSize =
    typeof config?.['batchSize'] === 'number' ? config['batchSize'] : 10;
  const results: Legislation[] = [];

  for (let i = 0; i < billList.length; i += batchSize) {
    const chunk = billList.slice(i, i + batchSize);
    const chunkResults = await Promise.all(
      chunk.map(async (bill: string) => {
        const billParts: string[] = bill.split('-');
        try {
          const res = await fetchNYSenateAPI<any>(
            `bills/${billParts.pop()}/${billParts.pop()}`,
            apiKey,
          );
          if (isSuccess<api.Bill>(res)) {
            if (!isItemsResponse<api.Bill>(res.result)) {
              return mapAPIBillToLegislation(res.result);
            } else {
              throw new Error(
                'Expected single bill, but received items response.',
              );
            }
          } else {
            throw new Error('Fetch failed');
          }
        } catch (error) {
          console.error(`Error fetching bill ${bill}:`, error);
          throw error;
        }
      }),
    );
    results.push(...chunkResults);
  }

  return results;
};
