import * as logger from 'firebase-functions/logger';
import { Person } from '@jpstroud/opencivicdata-types';
import { Legislator } from '@legislative-tracker/shared/models';
import { db, openStatesKey } from '../config';
import { getOpenStatesData } from '@legislative-tracker/server-data-access-openstates';
import {
  isEmail,
  isImageLink,
  getMemberUpdates,
  slugify,
} from '@legislative-tracker/server-util-core';

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
    const legislaturesSnapshot = await db.collection('legislatures').get();

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
        const openStatesPromise = getOpenStatesData(
          stateName,
          'people',
          openStatesKey.value(),
        );

        // Fetch State-Specific Data (Specific)
        // gracefully fallback to empty array if no helper exists for this state
        const stateApiPromise = getMemberUpdates(stateCode).catch(() => {
          logger.info(
            `No specific API implementation for ${stateCode}. Using OpenStates only.`,
          );
          return [] as Partial<Legislator>[];
        });

        const [openStatesMembers, stateMembers] = await Promise.all([
          openStatesPromise,
          stateApiPromise,
        ]);

        // Fetch existing Firestore docs to match against
        const snapshot = await db
          .collection(`legislatures/${stateCode}/legislators`)
          .get();

        const existingDocMap = new Map<
          string,
          FirebaseFirestore.QueryDocumentSnapshot
        >();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const docChamber =
            data.chamber?.toUpperCase() === 'SENATE' ? 'SENATE' : 'ASSEMBLY';
          if (data.district) {
            existingDocMap.set(`${docChamber}-${data.district}`, doc);
          }
        });

        // Combine OpenStates and State API members into a single map keyed by CHAMBER-DISTRICT
        interface MemberCombination {
          chamber: string;
          district: string;
          osMatch?: Person;
          stateMatch?: Partial<Legislator>;
        }

        const targetMap = new Map<string, MemberCombination>();

        openStatesMembers.forEach((os: any) => {
          const isSenate =
            os.current_role?.org_classification === 'upper' ||
            os.current_role?.title?.toLowerCase().includes('senat');
          const chamber = isSenate ? 'SENATE' : 'ASSEMBLY';
          const district = os.current_role?.district || '';
          if (!district) return;

          const key = `${chamber}-${district}`;
          const existing: MemberCombination = targetMap.get(key) || {
            chamber,
            district,
          };
          existing.osMatch = os;
          targetMap.set(key, existing);
        });

        stateMembers.forEach((sm: Partial<Legislator>) => {
          const chamber =
            sm.chamber?.toUpperCase() === 'SENATE' ? 'SENATE' : 'ASSEMBLY';
          const district = sm.district || '';
          if (!district) return;

          const key = `${chamber}-${district}`;
          const existing: MemberCombination = targetMap.get(key) || {
            chamber,
            district,
          };
          existing.stateMatch = sm;
          targetMap.set(key, existing);
        });

        const warnings: string[] = [];
        let matchedCount = 0;
        let createdCount = 0;

        // Upsert legislators into Firestore
        targetMap.forEach((combo, key) => {
          const { chamber, district, osMatch, stateMatch } = combo;
          const existingDoc = existingDocMap.get(key);

          const updates: Partial<Legislator> = {
            updated_at: new Date().toISOString(),
          };

          const name = stateMatch?.name || osMatch?.name;
          if (name) updates.name = name;

          const prefix =
            osMatch?.current_role?.title ||
            (chamber === 'SENATE' ? 'Senator' : 'Assembly Member');
          if (prefix) updates.honorific_prefix = prefix;

          const suffix =
            (osMatch as any)?.honorific_suffix || stateMatch?.honorific_suffix;
          if (suffix) updates.honorific_suffix = suffix;

          const givenName = osMatch?.given_name || stateMatch?.given_name;
          if (givenName) updates.given_name = givenName;

          const familyName = osMatch?.family_name || stateMatch?.family_name;
          if (familyName) updates.family_name = familyName;

          const sortName = (osMatch as any)?.sort_name || stateMatch?.sort_name;
          if (sortName) updates.sort_name = sortName;

          const gender = (osMatch as any)?.gender || stateMatch?.gender;
          if (gender) updates.gender = gender;

          updates.chamber = chamber;
          updates.district = district;

          const party = stateMatch?.party || osMatch?.party;
          if (party) updates.party = party;

          const validImage =
            (isImageLink(stateMatch?.image) ? stateMatch?.image : undefined) ||
            (isImageLink(osMatch?.image) ? osMatch?.image : undefined);
          if (validImage) updates.image = validImage;

          const newEmail = stateMatch?.email || osMatch?.email;
          if (isEmail(newEmail)) updates.email = newEmail;

          if (stateMatch?.offices && stateMatch.offices.length > 0) {
            updates.offices = stateMatch.offices;
          } else if (osMatch?.offices && osMatch.offices.length > 0) {
            updates.offices = osMatch.offices;
          }

          updates.links = osMatch?.links || stateMatch?.links || [];
          if (osMatch?.openstates_url)
            updates.openstates_url = osMatch.openstates_url;

          updates.other_identifiers = [
            ...(osMatch?.other_identifiers || []),
            ...(stateMatch?.other_identifiers || []),
          ];

          if (existingDoc) {
            updates.id = existingDoc.id;
            bulkWriter.set(existingDoc.ref, updates, { merge: true });
            matchedCount++;
          } else {
            const rawName = updates.name || '';
            const suff = updates.honorific_suffix || '';
            let fullName = rawName;
            if (suff && !rawName.toLowerCase().includes(suff.toLowerCase())) {
              fullName = `${rawName} ${suff}`;
            }

            const docId =
              slugify(fullName) ||
              `${stateCode.toLowerCase()}-${chamber.toLowerCase()}-${district}`;
            const newDocRef = db
              .collection(`legislatures/${stateCode}/legislators`)
              .doc(docId);

            updates.id = docId;
            (updates as any).created_at = new Date().toISOString();
            bulkWriter.set(newDocRef, updates, { merge: true });
            createdCount++;
          }
        });

        // Record any existing Firestore docs that were not matched by API data
        existingDocMap.forEach((doc, key) => {
          if (!targetMap.has(key)) {
            warnings.push(
              `No API match for existing legislator ${doc.data().name} (${key})`,
            );
          }
        });

        results.push({
          state: stateCode,
          matched: matchedCount + createdCount,
          warnings: warnings,
        });
      } catch (err) {
        logger.error(`Failed to update ${stateName}`, err);
        results.push({
          state: stateCode,
          error: err instanceof Error ? err.message : 'Unknown Error',
        });
      }
    });

    await Promise.all(updatePromises);
    await bulkWriter.close();

    return results;
  } catch (error) {
    logger.error('Global Update Failed', error);
    throw error;
  }
};
