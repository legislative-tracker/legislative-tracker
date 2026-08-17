import {
  OpenStatesJurisdiction,
  OpenStatesOtherIdentifier,
} from './openstates-shared';

export interface OpenStatesCurrentRole {
  title: string;
  org_classification: string;
  district: string;
  division_id: string;
}

export interface OpenStatesLink {
  url: string;
  note?: string;
}

export interface OpenStatesOffice {
  name: string;
  fax?: string;
  voice?: string;
  address?: string;
  classification?: string;
}

export interface OpenStatesPerson {
  id: string;
  name: string;
  party?: string;
  current_role?: OpenStatesCurrentRole;
  jurisdiction?: OpenStatesJurisdiction;
  given_name?: string;
  family_name?: string;
  image?: string;
  email?: string;
  gender?: string;
  birth_date?: string;
  death_date?: string;
  extras?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  openstates_url?: string;
  other_identifiers?: OpenStatesOtherIdentifier[];
  other_names?: { name: string; note?: string }[];
  links?: OpenStatesLink[];
  sources?: OpenStatesLink[];
  offices?: OpenStatesOffice[];
}
