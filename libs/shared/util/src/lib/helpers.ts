import { Legislator } from '@legislative-tracker/shared/models';
import { Person } from '@jpstroud/opencivicdata-types';
import { Success, ChamberMapping } from '@legislative-tracker/shared/models';

export const isSuccess = <T>(res: unknown): res is Success<T> => {
  if ((res as Success<T>)?.results) return true;
  return false;
};

const chamberMapping: ChamberMapping = {
  country: {
    upper: 'Senate',
    lower: 'House',
  },
  state: {
    upper: 'Senate',
    lower: 'Assembly',
  },
};

export const chamberMapper = (
  jurisdiction: string,
  chamber: string,
): string => {
  return chamberMapping[jurisdiction]?.[chamber] ?? chamber;
};

export const mapPersonToLegislator = (person: Person): Partial<Legislator> => {
  const chamber: string = chamberMapper(
    person.jurisdiction.classification,
    person.current_role.org_classification,
  );

  return {
    id: person.name.replaceAll('.', '').replaceAll(' ', '-'),
    honorific_prefix: person.current_role.title,
    name: person.name,
    party: person.party,
    chamber: chamber,
    district: person.current_role.district,
  };
};

export const isImageLink = (urlStr: string | undefined): boolean => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  if (/(no[-_]?image|placeholder|default[-_]?photo)/i.test(urlStr))
    return false;

  try {
    const url = new URL(urlStr);
    if (!['http:', 'https:'].includes(url.protocol)) return false;

    const imageExtensions = /\.(jpg|jpeg|png|webp|avif|gif|svg)($|\?)/i;
    if (imageExtensions.test(url.pathname) || imageExtensions.test(url.href)) {
      return true;
    }
    return /\/(images|headshot|photos?|avatars?)\//i.test(url.pathname);
  } catch (e) {
    return false;
  }
};

export const isEmail = (email: string | undefined): boolean => {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleanEmail);
};
