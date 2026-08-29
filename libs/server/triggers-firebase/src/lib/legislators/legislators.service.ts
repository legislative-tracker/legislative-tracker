import * as logger from 'firebase-functions/logger';
import { OpenStatesPerson } from '@legislative-tracker/shared/models';
import {
  updateMembers,
  getJurisdictionCode,
} from '@legislative-tracker/server-util-core';
import { db, dataAccessOpenStatesKey } from '../firebase.config';
import { formatDocId, UpdateResult } from '../helpers.util';

/**
 * Performs a batch synchronization of all elected state legislators from OpenStates into Firestore.
 * Iterates through active jurisdictions in the `legislatures` collection, queries OpenStates API v3,
 * and writes legislator documents to `legislatures/{stateCode}/ocd-person`.
 *
 * @returns Array of UpdateResult objects with counts of matched/created members per jurisdiction.
 */
export const updateLegislators = async (): Promise<UpdateResult[]> => {
  const bulkWriter = db.bulkWriter();
  const results: UpdateResult[] = [];

  try {
    const legislaturesSnapshot = await db.collection('legislatures').get();

    // Iterate over each state configured in the database
    const updatePromises = legislaturesSnapshot.docs.map(async (doc) => {
      const stateCode = getJurisdictionCode(doc.id);
      const stateData = doc.data();
      const stateName = stateData['name'] as string | undefined;

      if (!stateName) {
        logger.warn(`Skipping ${stateCode}: Missing 'name' property.`);
        return;
      }

      try {
        // Fetch OpenStates Data using updateMembers business logic function
        const openStatesMembers = await updateMembers({
          state: stateName,
          openstatesApiKey: dataAccessOpenStatesKey.value(),
        }).catch((err) => {
          logger.warn(
            `Failed to fetch OpenStates members for ${stateName}`,
            err,
          );
          return [] as OpenStatesPerson[];
        });

        // Fetch existing Firestore docs in ocd-person subcollection
        const snapshot = await db
          .collection(`legislatures/${stateCode}/ocd-person`)
          .get();

        const existingDocMap = new Map<
          string,
          FirebaseFirestore.QueryDocumentSnapshot
        >();
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const ocdId = (data['id'] as string | undefined) || d.id;
          existingDocMap.set(ocdId, d);
        });

        let matchedCount = 0;
        let createdCount = 0;
        const processedOcdIds = new Set<string>();

        // Upsert OpenStatesPerson records into legislatures/${stateCode}/ocd-person
        for (const person of openStatesMembers) {
          const docId = formatDocId(person.id);
          const docRef = db.doc(
            `legislatures/${stateCode}/ocd-person/${docId}`,
          );

          const existingDoc =
            existingDocMap.get(person.id) || existingDocMap.get(docId);

          if (existingDoc) {
            matchedCount++;
          } else {
            createdCount++;
          }

          bulkWriter.set(
            docRef,
            {
              ...person,
              updated_at: new Date().toISOString(),
            },
            { merge: true },
          );

          processedOcdIds.add(person.id);
          if (docId !== person.id) {
            processedOcdIds.add(docId);
          }
        }

        results.push({
          state: stateCode,
          matched: matchedCount + createdCount,
        });
      } catch (stateErr) {
        logger.error(`Error updating legislators for ${stateCode}`, stateErr);
        results.push({
          state: stateCode,
          error:
            stateErr instanceof Error ? stateErr.message : String(stateErr),
        });
      }
    });

    await Promise.all(updatePromises);
    await bulkWriter.close();
  } catch (err) {
    logger.error('Failed to update legislators', err);
    throw err;
  }

  return results;
};
