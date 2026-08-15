import {
  OpenStatesJurisdiction,
  OpenStatesOtherIdentifier,
} from './openstates-shared';

export interface OpenStatesOrganization {
  id: string;
  name: string;
  classification: string;
}

export interface OpenStatesRelatedBill {
  identifier: string;
  legislative_session: string;
  relation_type: string;
}

export interface OpenStatesAbstract {
  abstract: string;
  note?: string;
}

export interface OpenStatesPersonRole {
  title: string;
  org_classification: string;
  district: string;
  division_id: string;
}

export interface OpenStatesSponsorPerson {
  id: string;
  name: string;
  party?: string;
  current_role?: OpenStatesPersonRole;
}

export interface OpenStatesSponsorship {
  id?: string;
  name: string;
  entity_type: string;
  person?: OpenStatesSponsorPerson | null;
  primary: boolean;
  classification: string;
}

export interface OpenStatesRelatedEntity {
  name: string;
  entity_type: string;
}

export interface OpenStatesAction {
  id: string;
  organization: OpenStatesOrganization;
  description: string;
  date: string;
  classification: string[];
  order: number;
  related_entities: OpenStatesRelatedEntity[];
}

export interface OpenStatesDocumentMedia {
  name: string;
  url: string;
  media_type?: string;
}

export interface OpenStatesVersionOrDocument {
  note: string;
  date?: string;
  links: OpenStatesDocumentMedia[];
}

export interface OpenStatesBill {
  id: string;
  session: string;
  jurisdiction: OpenStatesJurisdiction;
  from_organization: OpenStatesOrganization;
  identifier: string;
  title: string;
  classification: string[];
  subject: string[];
  extras?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  openstates_url: string;
  first_action_date?: string;
  latest_action_date?: string;
  latest_action_description?: string;
  latest_passage_date?: string;
  related_bills?: OpenStatesRelatedBill[];
  abstracts?: OpenStatesAbstract[];
  other_titles?: string[];
  other_identifiers?: OpenStatesOtherIdentifier[];
  sponsorships?: OpenStatesSponsorship[];
  actions?: OpenStatesAction[];
  versions?: OpenStatesVersionOrDocument[];
  documents?: OpenStatesVersionOrDocument[];
}

export interface OpenStatesBillsResponse {
  results: OpenStatesBill[];
  pagination: {
    per_page: number;
    page: number;
    max_page: number;
    total_items: number;
  };
}
