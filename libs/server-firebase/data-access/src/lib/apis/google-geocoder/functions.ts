import { HttpsError } from "firebase-functions/v2/https";

import { GoogleGeocodingResponse } from "./types";
import { isSuccess } from "../../common/helpers";

export const getGeocode = async (address: string, googleMapsKey: string) => {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("key", googleMapsKey);
  url.searchParams.set("address", address);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new HttpsError(
      "unavailable",
      `Geocoding service error: ${response.statusText}`,
    );
  }

  const res = await response.json();

  if (isSuccess<GoogleGeocodingResponse[]>(res)) {
    return res.results[0].geometry.location;
  }

  throw new HttpsError("not-found", "Error finding geocoding", res);
};
