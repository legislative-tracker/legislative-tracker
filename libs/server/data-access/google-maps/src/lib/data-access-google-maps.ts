import { GoogleGeocodeSuccessResponse } from './google-maps.model';

/**
 * Type guard verifying if a Google Maps geocode API response succeeded with valid results.
 *
 * @param res - The parsed response payload.
 * @returns `true` if the response status is 'OK' and contains at least one result.
 */
const isGeocodeSuccess = (
  res: unknown,
): res is GoogleGeocodeSuccessResponse => {
  return (
    (res as GoogleGeocodeSuccessResponse)?.status === 'OK' &&
    Array.isArray((res as GoogleGeocodeSuccessResponse)?.results) &&
    (res as GoogleGeocodeSuccessResponse).results.length > 0
  );
};

/**
 * Geocodes a plaintext street address string into geographic coordinates (lat/lng).
 *
 * @param address - Full address string to geocode.
 * @param googleMapsKey - Google Maps Geocoding API key.
 * @returns Object containing numerical `lat` and `lng` coordinates.
 * @throws Error if the HTTP request fails or the Geocoding API returns an error status.
 */
export const getGeocode = async (
  address: string,
  googleMapsKey: string,
): Promise<{ lat: number; lng: number }> => {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('key', googleMapsKey);
  url.searchParams.set('address', address);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `Geocoding service error: ${response.status} ${response.statusText}`,
    );
  }

  const res = await response.json();

  if (isGeocodeSuccess(res)) {
    return res.results[0].geometry.location;
  }

  const status = (res as { status?: string })?.status || 'UNKNOWN';
  const errorMessage = (res as { error_message?: string })?.error_message || '';
  throw new Error(
    `Error finding geocoding for address: "${address}". Status: ${status}${
      errorMessage ? ` - ${errorMessage}` : ''
    }`,
  );
};
