import { HttpsError } from "firebase-functions/v2/https";
import got from "got";

import { GoogleGeocodingResponse } from "./types";
import { isSuccess } from "../../common/helpers";

export const getGeocode = async (address: string, googleMapsKey: string) => {
  const options = {
    prefixUrl: "https://maps.googleapis.com/maps/api/geocode",
    responseType: "json" as const,
    resolveBodyOnly: true,
    searchParams: {
      key: googleMapsKey,
      address: address,
    },
  };

  const instance = got.extend(options);
  const res = await instance("json");

  if (isSuccess<GoogleGeocodingResponse[]>(res)) {
    return res.results[0].geometry.location;
  }

  throw new HttpsError("not-found", "Error finding geocoding", res);
};
