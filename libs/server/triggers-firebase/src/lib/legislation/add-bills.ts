import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import {
  OpenStatesBill,
  Legislation,
} from '@legislative-tracker/shared/models';
import {
  getNewBill,
  getJurisdictionCode,
} from '@legislative-tracker/server-util-core';
import { db, dataAccessOpenStatesKey } from '../config';
import { formatDocId } from '../helpers';

/**
 * Adds multiple Bills by ID & Pulls Details (Callable)
 */
export const addBills = onCall(
  { secrets: [dataAccessOpenStatesKey] },
  async (request) => {
    if (request.auth?.token['admin'] !== true) {
      throw new HttpsError(
        'permission-denied',
        'Only admins can add legislation.',
      );
    }

    const { name, description, state, billIds } = request.data || {};
    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim() ||
      !state ||
      !Array.isArray(billIds) ||
      billIds.length === 0
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Name, state, and a non-empty array of billIds are required.',
      );
    }

    const stateKey = getJurisdictionCode(state);
    const ocdBillCollectionRef = db.collection(
      `legislatures/${stateKey}/ocd-bill`,
    );
    const legislationCollectionRef = db.collection(
      `legislatures/${stateKey}/legislation`,
    );

    const added: string[] = [];
    const failed: Array<{ billId: string; error: string }> = [];

    const apiKey = dataAccessOpenStatesKey.value();

    for (const billId of billIds) {
      if (!billId || typeof billId !== 'string' || !billId.trim()) {
        continue;
      }

      const cleanBillId = billId.trim();

      try {
        logger.info(
          `Attempting to fetch details for ${cleanBillId} in state ${state}...`,
        );

        const billData: OpenStatesBill = await getNewBill({
          state,
          billId: cleanBillId,
          openstatesApiKey: apiKey,
        });

        if (!billData || !billData.id) {
          throw new Error('No bill data returned from API.');
        }

        const docId = formatDocId(billData.id);
        const ocdBillDocRef = ocdBillCollectionRef.doc(docId);

        // 1. Write raw OpenStatesBill payload to ocd-bill subcollection
        await ocdBillDocRef.set(
          {
            ...billData,
            updated_at: new Date().toISOString(),
          },
          { merge: true },
        );

        // 2. Upsert Legislation document into legislation subcollection
        const chamber =
          billData.from_organization?.classification?.toLowerCase() || '';

        const isUpper = chamber.includes('upper') ? true : false;

        const stateBillIds: { upper?: string; lower?: string } = {};
        const ocdBillIds: { upper?: string; lower?: string } = {};

        if (isUpper) {
          stateBillIds.upper = billData.identifier;
          ocdBillIds.upper = billData.id;
        } else {
          stateBillIds.lower = billData.identifier;
          ocdBillIds.lower = billData.id;
        }

        const legislationData: Legislation = {
          name: name.trim(),
          ...(description && description.trim()
            ? { description: description.trim() }
            : billData.title
              ? { description: billData.title }
              : {}),
          stateBillIds,
          ocdBillIds,
        };

        const legislationDocRef = legislationCollectionRef.doc(docId);
        await legislationDocRef.set(legislationData, { merge: true });

        added.push(cleanBillId);
        logger.info(`Successfully added bill ${cleanBillId} (${docId})`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        logger.warn(`Failed to add bill ${cleanBillId}: ${errorMsg}`);
        failed.push({ billId: cleanBillId, error: errorMsg });
      }
    }

    return {
      message: `Processed ${billIds.length} bill(s): ${added.length} added, ${failed.length} failed.`,
      added,
      failed,
    };
  },
);
