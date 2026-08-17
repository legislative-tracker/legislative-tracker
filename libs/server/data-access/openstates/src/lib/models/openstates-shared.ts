export interface OpenStatesJurisdiction {
  id: string;
  name: string;
  classification: string;
}

export interface OpenStatesOtherIdentifier {
  identifier: string;
  scheme: string;
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
