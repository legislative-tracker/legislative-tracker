export interface OSResponse<T> {
  results: T[];
  pagination: {
    per_page: number;
    page: number;
    max_page: number;
    total_items: number;
  };
}
