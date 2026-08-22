export interface OpenStatesJurisdiction {
  id: string;
  name: string;
  classification?: string;
}

export interface OpenStatesOrganization {
  id: string;
  name: string;
  classification?: string;
}

export interface OpenStatesOtherIdentifier {
  identifier: string;
  scheme: string;
}

export interface OpenStatesCurrentRole {
  title: string;
  org_classification: string;
  district: string;
  division_id?: string;
}

export interface OpenStatesLink {
  url: string;
  note?: string;
}

export interface OpenStatesResponse<T> {
  results: T[];
  pagination: {
    per_page: number;
    page: number;
    max_page: number;
    total_items: number;
  };
}
