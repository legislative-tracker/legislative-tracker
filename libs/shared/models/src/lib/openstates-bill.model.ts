import {
  OpenStatesCurrentRole,
  OpenStatesJurisdiction,
  OpenStatesLink,
  OpenStatesOrganization,
  OpenStatesOtherIdentifier,
} from './openstates-shared.model';

/**
 * Companion or related bill reference across chambers or sessions.
 */
export interface OpenStatesRelatedBill {
  /** Identifier of the related bill (e.g., 'A200'). */
  identifier: string;
  /** Legislative session identifier. */
  legislative_session: string;
  /** Type of relationship (e.g., 'companion', 'prior-session'). */
  relation_type: string;
}

/**
 * Plaintext summary or official abstract of a bill.
 */
export interface OpenStatesAbstract {
  /** Summary or abstract text. */
  abstract: string;
  /** Explanatory note or source description. */
  note?: string;
}

/**
 * Summary sponsor persona on an Open Civic Data bill.
 */
export interface OpenStatesSponsorPerson {
  /** Open Civic Data person identifier. */
  id: string;
  /** Full name of the sponsor. */
  name: string;
  /** Political party affiliation. */
  party?: string;
  /** Current legislative office role. */
  current_role?: OpenStatesCurrentRole;
}

/**
 * Sponsorship entry for a bill (primary sponsor, co-sponsor, or multi-sponsor).
 */
export interface OpenStatesSponsorship {
  /** Sponsorship record identifier. */
  id?: string;
  /** Name of the sponsoring person or committee. */
  name: string;
  /** Entity type ('person' or 'organization'). */
  entity_type: string;
  /** Associated person details if resolved. */
  person?: OpenStatesSponsorPerson | null;
  /** True if this sponsor is the primary or prime sponsor. */
  primary: boolean;
  /** Sponsorship classification (e.g., 'primary', 'cosponsor'). */
  classification: string;
}

/**
 * Entity (person, committee, or agency) referenced in a legislative action.
 */
export interface OpenStatesRelatedEntity {
  /** Name of the entity. */
  name: string;
  /** Entity classification ('person', 'organization'). */
  entity_type: string;
}

/**
 * Formal legislative action recorded in a chamber journal/record.
 */
export interface OpenStatesAction {
  /** Action record identifier. */
  id: string;
  /** Chamber or committee that executed the action. */
  organization?: OpenStatesOrganization;
  /** Description of the action (e.g. 'Read second time', 'Referred to Committee'). */
  description: string;
  /** Date action occurred (YYYY-MM-DD). */
  date: string;
  /** Standardized classifications for the action. */
  classification?: string[];
  /** Chronological ordering index. */
  order?: number;
  /** Associated entities involved in the action. */
  related_entities?: OpenStatesRelatedEntity[];
}

/**
 * File link or document media attachment for a bill version or report.
 */
export interface OpenStatesDocumentMedia {
  /** Display title or media name. */
  name: string;
  /** HTTP(S) URL to the document asset (PDF, HTML). */
  url: string;
  /** MIME type (e.g., 'application/pdf', 'text/html'). */
  media_type?: string;
}

/**
 * Bill text version, fiscal note, or committee report.
 */
export interface OpenStatesVersionOrDocument {
  /** Descriptive note (e.g., 'Introduced Version', 'Fiscal Note'). */
  note: string;
  /** Publication or filing date (YYYY-MM-DD). */
  date?: string;
  /** Document media download links. */
  links: OpenStatesDocumentMedia[];
}

/**
 * Vote tally count summary for a specific voting option.
 */
export interface OpenStatesVoteCount {
  /** Voting option ('yes', 'no', 'abstain', 'not voting', etc.). */
  option: string;
  /** Number of votes recorded. */
  value: number;
}

/**
 * Roll call vote cast by an individual legislator.
 */
export interface OpenStatesPersonVote {
  /** Vote choice cast ('yes', 'no', 'abstain', etc.). */
  option: string;
  /** Full name of the voter. */
  voter_name: string;
  /** Open Civic Data person ID if resolved. */
  voter_id?: string | null;
}

/**
 * Recorded roll call vote or division on a bill motion.
 */
export interface OpenStatesVote {
  /** Vote event identifier. */
  id: string;
  /** Text of the motion voted upon. */
  motion_text: string;
  /** Classification tags for the motion. */
  motion_classification?: string[];
  /** Date and time when vote occurred. */
  start_date: string;
  /** Outcome result ('pass', 'fail'). */
  result: string;
  /** Legislative organization conducting the vote. */
  organization?: OpenStatesOrganization;
  /** Aggregate vote tally counts. */
  counts?: OpenStatesVoteCount[];
  /** Individual roll call member votes. */
  votes?: OpenStatesPersonVote[];
  /** Data sources for the vote record. */
  sources?: OpenStatesLink[];
}

/**
 * Full Open Civic Data bill representation from Open States.
 */
export interface OpenStatesBill {
  /** Unique Open Civic Data bill identifier. */
  id: string;
  /** Legislative session identifier (e.g., '2025-2026', '2025 Regular Session'). */
  session: string;
  /** Jurisdiction details. */
  jurisdiction?: OpenStatesJurisdiction;
  /** Chamber or house where bill originated. */
  from_organization?: OpenStatesOrganization;
  /** Canonical bill identifier (e.g., 'SB 100', 'A 42'). */
  identifier: string;
  /** Official title or subject description. */
  title: string;
  /** Classifications ('bill', 'resolution', 'constitutional amendment'). */
  classification?: string[];
  /** Subject topic taxonomy tags. */
  subject?: string[];
  /** Arbitrary jurisdiction or state metadata. */
  extras?: Record<string, unknown>;
  /** Timestamp when bill record was created. */
  created_at?: string;
  /** Timestamp when bill record was last modified. */
  updated_at?: string;
  /** Canonical URL on OpenStates.org. */
  openstates_url?: string;
  /** Date of introduction / first action. */
  first_action_date?: string;
  /** Date of most recent legislative action. */
  latest_action_date?: string;
  /** Text description of most recent legislative action. */
  latest_action_description?: string;
  /** Date of final passage if passed. */
  latest_passage_date?: string;
  /** Companion or related bills across chambers. */
  related_bills?: OpenStatesRelatedBill[];
  /** Bill abstracts and summaries. */
  abstracts?: OpenStatesAbstract[];
  /** Alternate titles or short names. */
  other_titles?: string[];
  /** External system identifiers. */
  other_identifiers?: OpenStatesOtherIdentifier[];
  /** Full list of primary and co-sponsors. */
  sponsorships?: OpenStatesSponsorship[];
  /** Chronological history of actions taken on the bill. */
  actions?: OpenStatesAction[];
  /** Web sources used to compile bill data. */
  sources?: OpenStatesLink[];
  /** Formal published versions of the bill text. */
  versions?: OpenStatesVersionOrDocument[];
  /** Associated committee reports, fiscal notes, and amendments. */
  documents?: OpenStatesVersionOrDocument[];
  /** Recorded roll call votes. */
  votes?: OpenStatesVote[];
}
