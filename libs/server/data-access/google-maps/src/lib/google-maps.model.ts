/**
 * Geocoded address component returned by the Google Maps Geocoding API.
 */
export interface GoogleGeocodingResponse {
  /** Individual address components (street number, route, locality, postal code, etc.). */
  address_components: {
    /** Full text name of the address component. */
    long_name: string;
    /** Abbreviated name or symbol of the address component. */
    short_name: string;
    /** Category tags for the address component. */
    types: string[];
  }[];
  /** Human-readable formatted address string. */
  formatted_address: string;
  /** Geometry location coordinates and bounding viewport. */
  geometry: {
    /** Bounding box coordinates. */
    bounds: object;
    /** Latitude and longitude point coordinates. */
    location: {
      /** Latitude value in degrees. */
      lat: number;
      /** Longitude value in degrees. */
      lng: number;
    };
    /** Geocoding precision type (e.g., 'ROOFTOP', 'RANGE_INTERPOLATED'). */
    location_type: string;
    /** Viewport bounding box. */
    viewport: object;
  };
  /** Navigation waypoint points. */
  navigation_points: [];
  /** Unique Google Place ID. */
  place_id: string;
  /** Place categorization types. */
  types: string[];
}

/**
 * Top-level response returned by the Google Maps Geocoding JSON API.
 */
export interface GoogleGeocodeSuccessResponse {
  /** API status code ('OK', 'ZERO_RESULTS', 'OVER_QUERY_LIMIT', etc.). */
  status: string;
  /** Array of matching geocoded results. */
  results: GoogleGeocodingResponse[];
}
