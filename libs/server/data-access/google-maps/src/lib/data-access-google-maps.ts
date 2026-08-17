import { GoogleGeocodeSuccessResponse } from './model';

const isGeocodeSuccess = (
  res: unknown,
): res is GoogleGeocodeSuccessResponse => {
  return (
    (res as GoogleGeocodeSuccessResponse)?.status === 'OK' &&
    Array.isArray((res as GoogleGeocodeSuccessResponse)?.results) &&
    (res as GoogleGeocodeSuccessResponse).results.length > 0
  );
};

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
