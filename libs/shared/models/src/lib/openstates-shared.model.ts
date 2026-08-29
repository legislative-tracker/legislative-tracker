/**
 * Represents a state or municipal jurisdiction in Open Civic Data.
 */
export interface OpenStatesJurisdiction {
  /** Full Open Civic Data jurisdiction identifier. */
  id: string;
  /** Human-readable jurisdiction name. */
  name: string;
  /** Jurisdiction classification (e.g., 'government', 'state'). */
  classification?: string;
}

/**
 * Represents a legislative organization, committee, or chamber in Open Civic Data.
 */
export interface OpenStatesOrganization {
  /** Open Civic Data organization identifier. */
  id: string;
  /** Organization display name (e.g. 'Senate', 'Assembly'). */
  name: string;
  /** Classification of organization (e.g., 'upper', 'lower', 'committee'). */
  classification?: string;
}

/**
 * Alternate identifier for an entity in external systems.
 */
export interface OpenStatesOtherIdentifier {
  /** The identifier string value. */
  identifier: string;
  /** Scheme naming the external system (e.g., 'lis', 'bioguide'). */
  scheme: string;
}

/**
 * Current official role held by a legislator.
 */
export interface OpenStatesCurrentRole {
  /** Office title (e.g. 'Senator', 'Representative'). */
  title: string;
  /** Legislative organization classification (e.g. 'upper', 'lower'). */
  org_classification: string;
  /** District number or name represented. */
  district: string;
  /** Division identifier for the district. */
  division_id?: string;
}

/**
 * Web link associated with an Open Civic Data record.
 */
export interface OpenStatesLink {
  /** Target HTTP(S) URL. */
  url: string;
  /** Description or label for the link. */
  note?: string;
}

/**
 * Paginated API response structure returned by the Open States API v3.
 * @typeParam T - Type of the items contained in results.
 */
export interface OpenStatesResponse<T> {
  /** Array of result items for the current page. */
  results: T[];
  /** Pagination metadata. */
  pagination: {
    /** Items per page. */
    per_page: number;
    /** Current 1-based page number. */
    page: number;
    /** Total number of available pages. */
    max_page: number;
    /** Total number of items matching query. */
    total_items: number;
  };
}
