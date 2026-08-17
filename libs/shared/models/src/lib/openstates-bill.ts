import {
  OpenStatesCurrentRole,
  OpenStatesJurisdiction,
  OpenStatesLink,
  OpenStatesOrganization,
  OpenStatesOtherIdentifier,
} from './openstates-shared';

export interface OpenStatesRelatedBill {
  identifier: string;
  legislative_session: string;
  relation_type: string;
}

export interface OpenStatesAbstract {
  abstract: string;
  note?: string;
}

export interface OpenStatesSponsorPerson {
  id: string;
  name: string;
  party?: string;
  current_role?: OpenStatesCurrentRole;
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

export interface OpenStatesVoteCount {
  option: string;
  value: number;
}

export interface OpenStatesPersonVote {
  option: string;
  voter_name: string;
  voter_id?: string | null;
}

export interface OpenStatesVote {
  id: string;
  motion_text: string;
  motion_classification: string[];
  start_date: string;
  result: string;
  organization?: OpenStatesOrganization;
  counts?: OpenStatesVoteCount[];
  votes?: OpenStatesPersonVote[];
  sources?: OpenStatesLink[];
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
  sources?: OpenStatesLink[];
  versions?: OpenStatesVersionOrDocument[];
  documents?: OpenStatesVersionOrDocument[];
  votes?: OpenStatesVote[];
}
