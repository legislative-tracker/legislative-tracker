import {
  OpenStatesCurrentRole,
  OpenStatesJurisdiction,
  OpenStatesLink,
  OpenStatesOtherIdentifier,
} from './openstates-shared.model';

/**
 * Summary record of a bill sponsored by a legislator.
 */
export interface PersonSponsorship {
  /** Internal tracked legislation ID in Firestore. */
  legislationId: string;
  /** Human-readable bill title. */
  billName: string;
  /** Canonical state bill identifier (e.g., 'S100'). */
  stateBillId: string;
  /** Open Civic Data bill identifier. */
  ocdBillId: string;
}

/**
 * Contact and location details for a legislator's official office.
 */
export interface OpenStatesOffice {
  /** Office title (e.g., 'Capitol Office', 'District Office'). */
  name: string;
  /** Official fax number. */
  fax?: string;
  /** Official phone number. */
  voice?: string;
  /** Physical street mailing address. */
  address?: string;
  /** Office classification (e.g., 'capitol', 'district'). */
  classification?: string;
}

/**
 * Full representation of a legislator or elected official from Open States.
 */
export interface OpenStatesPerson {
  /** Unique Open Civic Data person identifier. */
  id: string;
  /** Full display name. */
  name: string;
  /** Political party affiliation (e.g., 'Democratic', 'Republican'). */
  party?: string;
  /** Current legislative role details. */
  current_role?: OpenStatesCurrentRole;
  /** State jurisdiction details. */
  jurisdiction?: OpenStatesJurisdiction;
  /** Given / first name. */
  given_name?: string;
  /** Family / last name. */
  family_name?: string;
  /** Headshot or portrait image URL. */
  image?: string;
  /** Official email address. */
  email?: string;
  /** Gender identifier if reported. */
  gender?: string;
  /** Date of birth (YYYY-MM-DD). */
  birth_date?: string;
  /** Date of death if deceased. */
  death_date?: string;
  /** Arbitrary jurisdiction or third-party metadata. */
  extras?: Record<string, unknown>;
  /** Timestamp when person record was first created. */
  created_at?: string;
  /** Timestamp when person record was last modified. */
  updated_at?: string;
  /** Canonical URL on OpenStates.org. */
  openstates_url?: string;
  /** External system identifiers (Bioguide, LIS, etc.). */
  other_identifiers?: OpenStatesOtherIdentifier[];
  /** Alternate aliases or former names. */
  other_names?: { name: string; note?: string }[];
  /** External web links (social media, official websites). */
  links?: OpenStatesLink[];
  /** Data attribution source URLs. */
  sources?: OpenStatesLink[];
  /** Official legislative and district offices. */
  offices?: OpenStatesOffice[];
  /** Tracked legislative sponsorships linked to this member. */
  sponsorships?: PersonSponsorship[];
  /** Resolved legislative district. */
  district?: string;
}
