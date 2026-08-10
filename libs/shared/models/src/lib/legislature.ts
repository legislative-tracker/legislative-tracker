import { Person as PopoloPerson, Motion as PopoloMotion } from 'popolo-types';

export interface Legislator extends Omit<Partial<PopoloPerson>, 'gender'> {
  id: string;
  name: string;
  honorific_prefix?: string;
  honorific_suffix?: string;
  party?: string;
  chamber?: string;
  district?: string;
  additional_name?: string;
  sort_name?: string;
  gender?: string;
  image?: string;
  email?: string;
  offices?: any[];
  links?: any[];
  openstates_url?: string;
  other_identifiers?: any[];
  sponsorships?: Sponsorship[];
  jurisdiction?: any;
  current_role?: any;
  given_name?: string;
  family_name?: string;
  updated_at?: string;
}

export interface Legislation extends Omit<Partial<PopoloMotion>, 'classification' | 'identifier'> {
  id: string;
  title?: string;
  version?: string;
  session?: string;
  identifier?: string;
  jurisdiction?: any;
  from_organization?: any;
  classification?: string | string[];
  subject?: any[];
  extras?: any;
  created_at?: string;
  updated_at?: string;
  openstates_url?: string;
  first_action_date?: string;
  latest_action_date?: string;
  latest_action_description?: string;
  latest_passage_date?: string;
  actions?: any[];
  versions?: any[];
  documents?: any[];
  current_version?: string;
  text?: string;
  cosponsors?: {
    [key: string]: Cosponsor[];
  };
  sponsorships?: any[];
}

export type Sponsorship = {
  id: string;
  version?: string;
  title?: string;
  name?: string;
  entity_type?: string;
  primary?: boolean;
  classification?: string;
};

export type Cosponsor = {
  id: string;
  name: string;
  chamber?: string;
  district?: string;
};

export type Legislature = {
  name: string;
};

export interface LegislatureUpdateFnMap<T> {
  [key: string]: {
    bills: (list: string[]) => Promise<T>;
    members: () => Promise<T>;
  };
}
