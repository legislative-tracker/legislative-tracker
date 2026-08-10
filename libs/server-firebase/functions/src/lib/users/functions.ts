import { onCall, HttpsError } from "firebase-functions/v2/https";
import got from "got";
import { Person } from "@jpstroud/opencivicdata-types";
import {
  db,
  openStatesKey,
  googleMapsKey,
  getGeocode,
  isSuccess,
  mapPersonToLegislator,
} from "@legislative-tracker/server-firebase/data-access";

// Helper specific to this domain
const updateUserProfile = async (userId: string, data: object) => {
  const userRef = db.collection("users").doc(userId);
  await userRef.set(data, { merge: true });
};

export const fetchUserReps = onCall(
  { secrets: [openStatesKey, googleMapsKey] },
  async (request) => {
    const address = request.data.address;
    if (!address) throw new HttpsError("invalid-argument", "Address required.");

    const userId = request.auth?.uid;
    if (!userId) throw new HttpsError("invalid-argument", "User ID required.");

    const geocoding = await getGeocode(address, googleMapsKey.value());
    if (!geocoding) throw new HttpsError("not-found", "Geocoding failed");

    const instance = got.extend({
      prefixUrl: "https://v3.openstates.org/",
      responseType: "json",
      resolveBodyOnly: true,
      searchParams: {
        apikey: openStatesKey.value(),
        lat: geocoding.lat,
        lng: geocoding.lng,
      },
    });

    try {
      const res = await instance("people.geo");

      if (isSuccess<Person[]>(res)) {
        const people = {
          federal: res.results
            .filter((p) => p.jurisdiction.classification === "country")
            .map(mapPersonToLegislator),
          state: res.results
            .filter((p) => p.jurisdiction.classification === "state")
            .map(mapPersonToLegislator),
        };

        const districts = {
          federal: people.federal.find((p) => p.chamber === "House")?.district,
          state: {
            assembly: people.state.find((p) => p.chamber === "Assembly")
              ?.district,
            senate: people.state.find((p) => p.chamber === "Senate")?.district,
          },
        };

        const stateCode: string = districts.federal
          ?.split("-")[0]
          .toLowerCase() as string;
        const path = `legislatures/${stateCode}/legislators`;

        const assemblySnapshot = await db
          .collection(path)
          .where("chamber", "==", "ASSEMBLY")
          .where("district", "==", String(districts.state.assembly))
          .get();

        const senateSnapshot = await db
          .collection(path)
          .where("chamber", "==", "SENATE")
          .where("district", "==", String(districts.state.senate))
          .get();

        const a = assemblySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const s = senateSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const stateLegislators = [...a, ...s];

        await updateUserProfile(userId, {
          districts,
          legislators: { federal: people.federal, state: stateLegislators },
        });

        return { districts };
      } else {
        throw new HttpsError("unavailable", "Failed to parse data.");
      }
    } catch (error: any) {
      console.error("Fetch Reps Error: ", error);
      throw new HttpsError("unknown", "Failed to fetch reps.", error.message);
    }
  }
);
