import * as logger from 'firebase-functions/logger';
import { OpenStatesPerson } from '@legislative-tracker/shared/models';
import { updateMembers } from '@legislative-tracker/server-util-core';
import { db, dataAccessOpenStatesKey } from '../config';
import { formatDocId, UpdateResult } from '../helpers';

export const updateLegislators = async (): Promise<UpdateResult[]> => {
  const bulkWriter = db.bulkWriter();
  const results: UpdateResult[] = [];

  try {
    const legislaturesSnapshot = await db.collection('legislatures').get();

    // Iterate over each state configured in the database
    const updatePromises = legislaturesSnapshot.docs.map(async (doc) => {
      const stateCode = doc.id;
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
        openStatesMembers.forEach((person: OpenStatesPerson) => {
          if (!person.id) return;
          processedOcdIds.add(person.id);

          const docId = formatDocId(person.id);
          const docRef = db
            .collection(`legislatures/${stateCode}/ocd-person`)
            .doc(docId);

          const payload: OpenStatesPerson = {
            ...person,
            updated_at: new Date().toISOString(),
          };

          if (existingDocMap.has(person.id)) {
            matchedCount++;
          } else {
            createdCount++;
          }

          bulkWriter.set(docRef, payload, { merge: true });
        });

        // Record warnings for any existing Firestore docs not found in OpenStates API payload
        const warnings: string[] = [];
        existingDocMap.forEach((existingDoc, ocdId) => {
          if (!processedOcdIds.has(ocdId)) {
            const docName = existingDoc.data()['name'] || 'Unknown';
            warnings.push(
              `No API match for existing legislator ${docName} (${ocdId})`,
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
