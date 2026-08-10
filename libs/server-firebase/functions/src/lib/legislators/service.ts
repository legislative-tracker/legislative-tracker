import * as logger from "firebase-functions/logger";
import { Person } from "@jpstroud/opencivicdata-types";
import { Legislator } from "@legislative-tracker/shared/models";
import {
  db,
  getOpenStatesData,
  isEmail,
  isImageLink,
  getMemberUpdates,
} from "@legislative-tracker/server-firebase/data-access";

export interface UpdateResult {
  state: string;
  matched?: number;
  warnings?: string[];
  error?: string;
}

export const updateLegislators = async (): Promise<UpdateResult[]> => {
  const bulkWriter = db.bulkWriter();
  const results: UpdateResult[] = [];

  try {
    const legislaturesSnapshot = await db.collection("legislatures").get();

    // Iterate over each state configured in the database
    const updatePromises = legislaturesSnapshot.docs.map(async (doc) => {
      const stateCode = doc.id;
      const stateName = doc.data().name;

      if (!stateName) {
        logger.warn(`Skipping ${stateCode}: Missing 'name' property.`);
        return;
      }

      try {
        // Fetch OpenStates Data (Generic)
        const openStatesPromise = getOpenStatesData(stateName, "people");

        // Fetch State-Specific Data (Specific)
        // gracefully fallback to empty array if no helper exists for this state
        const stateApiPromise = getMemberUpdates(stateCode).catch(() => {
          logger.info(
            `No specific API implementation for ${stateCode}. Using OpenStates only.`
          );
          return [] as Legislator[];
        });

        const [openStatesMembers, stateMembers] = await Promise.all([
          openStatesPromise,
          stateApiPromise,
        ]);

        // Create O(1) Lookup Map for State Data
        const stateMemberMap = new Map<string, Legislator>();
        stateMembers.forEach((m) => {
          const key = `${m.chamber.toUpperCase()}-${m.district}`;
          stateMemberMap.set(key, m);
        });

        // Fetch existing Firestore docs to update
        const snapshot = await db
          .collection(`legislatures/${stateCode}/legislators`)
          .get();

        const warnings: string[] = [];

        // Merge and Update
        snapshot.docs.forEach((doc) => {
          const currentData = doc.data();

          const docChamber =
            currentData.chamber?.toUpperCase() === "SENATE"
              ? "SENATE"
              : "ASSEMBLY";
          const lookupKey = `${docChamber}-${currentData.district}`;

          const osMatch = openStatesMembers.find(
            (m: Person) =>
              m.current_role.title === currentData.honorific_prefix &&
              m.current_role.district === currentData.district
          );

          const stateMatch = stateMemberMap.get(lookupKey);

          if (osMatch || stateMatch) {
            const updates: any = {
              updated_at: new Date().toISOString(),
            };

            // Merge Strategies
            updates.party = stateMatch?.party || osMatch?.party;

            const newImage = stateMatch?.image || osMatch?.image;
            if (isImageLink(newImage)) updates.image = newImage;

            const newEmail = stateMatch?.email || osMatch?.email;
            if (isEmail(newEmail)) updates.email = newEmail;

            if (stateMatch?.offices && stateMatch.offices.length > 0) {
              updates.offices = stateMatch.offices;
            } else if (osMatch?.offices) {
              updates.offices = osMatch.offices;
            }

            updates.links = osMatch?.links || stateMatch?.links || [];
            updates.openstates_url = osMatch?.openstates_url || "";

            updates.other_identifiers = [
              ...(osMatch?.other_identifiers || []),
              ...(stateMatch?.other_identifiers || []),
            ];

            bulkWriter.set(doc.ref, updates, { merge: true });
          } else {
            warnings.push(`No match for ${currentData.name} (${lookupKey})`);
          }
        });

        results.push({
          state: stateCode,
          matched: snapshot.size - warnings.length,
          warnings: warnings,
        });
      } catch (err) {
        logger.error(`Failed to update ${stateName}`, err);
        results.push({
          state: stateCode,
          error: err instanceof Error ? err.message : "Unknown Error",
        });
      }
    });

    await Promise.all(updatePromises);
    await bulkWriter.close();

    return results;
  } catch (error) {
    logger.error("Global Update Failed", error);
    throw error;
  }
};
