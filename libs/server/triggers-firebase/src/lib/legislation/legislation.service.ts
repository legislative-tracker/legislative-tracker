import * as logger from 'firebase-functions/logger';
import { OpenStatesBill } from '@legislative-tracker/shared/models';
import {
  updateBills,
  getJurisdictionCode,
} from '@legislative-tracker/server-util-core';
import { db, dataAccessOpenStatesKey } from '../firebase.config';
import { formatDocId, UpdateResult } from '../helpers.util';

/**
 * Performs a batch update of all tracked legislation across all state jurisdictions configured in Firestore.
 * Iterates through `legislatures/{stateCode}/ocd-bill`, fetches latest bill statuses from OpenStates,
 * and writes updated documents back to Firestore using a BulkWriter.
 *
 * @returns Array of UpdateResult objects summarizing the count of updated records and warnings per jurisdiction.
 */
export const performLegislationUpdate = async (): Promise<UpdateResult[]> => {
  const bulkWriter = db.bulkWriter();
  const results: UpdateResult[] = [];

  try {
    const legislaturesSnapshot = await db.collection('legislatures').get();

    const updatePromises = legislaturesSnapshot.docs.map(async (doc) => {
      const stateCode = getJurisdictionCode(doc.id);
      const stateData = doc.data();
      const stateName = stateData['name'] as string | undefined;

      try {
        // Query existing docs in legislatures/${stateCode}/ocd-bill
        const snapshot = await db
          .collection(`legislatures/${stateCode}/ocd-bill`)
          .get();

        if (snapshot.empty) {
          results.push({
            state: stateCode,
            matched: 0,
            warnings: [
              `No existing bills found in ocd-bill subcollection for ${stateCode}`,
            ],
          });
          return;
        }

        // Collect existing OCD IDs (stored id property or doc.id)
        const ocdIds: string[] = [];
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const ocdId = (data['id'] as string | undefined) || d.id;
          if (ocdId) {
            ocdIds.push(ocdId);
          }
        });

        // Fetch updated bills via updateBills business logic
        const updatedBills = await updateBills({
          ocdIds,
          state: stateName,
          openstatesApiKey: dataAccessOpenStatesKey.value(),
        }).catch((err) => {
          logger.warn(`Failed to update bills for ${stateCode}`, err);
          return [] as OpenStatesBill[];
        });

        let matchedCount = 0;
        const updatedOcdIds = new Set<string>();

        // Upsert updated bills into legislatures/${stateCode}/ocd-bill
        for (const bill of updatedBills) {
          const docId = formatDocId(bill.id);
          const docRef = db.doc(`legislatures/${stateCode}/ocd-bill/${docId}`);

          bulkWriter.set(
            docRef,
            {
              ...bill,
              updated_at: new Date().toISOString(),
            },
            { merge: true },
          );

          matchedCount++;
          updatedOcdIds.add(bill.id);
          if (docId !== bill.id) {
            updatedOcdIds.add(docId);
          }
        }

        // Identify any bills that failed to refresh from OpenStates
        const warnings: string[] = [];
        for (const ocdId of ocdIds) {
          const docId = formatDocId(ocdId);
          if (!updatedOcdIds.has(ocdId) && !updatedOcdIds.has(docId)) {
            warnings.push(
              `Bill ${ocdId} was not returned by OpenStates update`,
            );
          }
        }

        results.push({
          state: stateCode,
          matched: matchedCount,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
      } catch (stateErr) {
        logger.error(`Error updating legislation for ${stateCode}`, stateErr);
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
    logger.error('Failed to perform legislation update', err);
    throw err;
  }

  return results;
};
