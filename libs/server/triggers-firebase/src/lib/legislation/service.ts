import * as logger from 'firebase-functions/logger';
import { OpenStatesBill } from '@legislative-tracker/shared/models';
import { updateBills } from '@legislative-tracker/server-util-core';
import { db, dataAccessOpenStatesKey } from '../config';
import { formatDocId, UpdateResult } from '../helpers';

export const performLegislationUpdate = async (): Promise<UpdateResult[]> => {
  const bulkWriter = db.bulkWriter();
  const results: UpdateResult[] = [];

  try {
    const legislaturesSnapshot = await db.collection('legislatures').get();

    const updatePromises = legislaturesSnapshot.docs.map(async (doc) => {
      const stateCode = doc.id;
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

        updatedBills.forEach((bill: OpenStatesBill) => {
          if (!bill.id) return;
          updatedOcdIds.add(bill.id);

          const docId = formatDocId(bill.id);
          const docRef = db
            .collection(`legislatures/${stateCode}/ocd-bill`)
            .doc(docId);

          const payload: OpenStatesBill = {
            ...bill,
            updated_at: new Date().toISOString(),
          };

          matchedCount++;
          bulkWriter.set(docRef, payload, { merge: true });
        });

        const warnings: string[] = [];
        ocdIds.forEach((id) => {
          if (!updatedOcdIds.has(id)) {
            warnings.push(`Failed to fetch updated bill data for OCD ID ${id}`);
          }
        });

        results.push({
          state: stateCode,
          matched: matchedCount,
          warnings,
        });
      } catch (err) {
        logger.error(
          `Failed to perform legislation update for ${stateCode}`,
          err,
        );
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
    logger.error('Global Legislation Update Failed', error);
    throw error;
  }
};
