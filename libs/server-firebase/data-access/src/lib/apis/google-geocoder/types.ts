export interface GoogleGeocodingResponse {
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  formatted_address: string;
  geometry: {
    bounds: object;
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: object;
  };
  navigation_points: [];
  place_id: string;
  types: string[];
}
