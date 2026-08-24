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
import { db, dataAccessOpenStatesKey } from '../firebase.config';
import { formatDocId } from '../helpers.util';

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

    const stateBillIds: { upper?: string; lower?: string } = {};
    const ocdBillIds: { upper?: string; lower?: string } = {};
    let upperBillId: string | undefined;
    let lowerBillId: string | undefined;
    let primaryDocId: string | undefined;
    let fallbackDescription: string | undefined;

    const validBills: Array<{ billData: OpenStatesBill; docId: string }> = [];

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
        validBills.push({ billData, docId });

        // Accumulate chamber data for single Legislation document
        const chamber =
          billData.from_organization?.classification?.toLowerCase() || '';

        const isUpper = chamber.includes('upper');

        if (isUpper) {
          stateBillIds.upper = billData.identifier;
          ocdBillIds.upper = billData.id;
          upperBillId = billData.identifier;
        } else {
          stateBillIds.lower = billData.identifier;
          ocdBillIds.lower = billData.id;
          lowerBillId = billData.identifier;
        }

        if (!primaryDocId) {
          primaryDocId = docId;
        }
        if (!fallbackDescription && billData.title) {
          fallbackDescription = billData.title;
        }

        added.push(cleanBillId);
        logger.info(`Successfully processed bill ${cleanBillId} (${docId})`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        logger.warn(`Failed to add bill ${cleanBillId}: ${errorMsg}`);
        failed.push({ billId: cleanBillId, error: errorMsg });
      }
    }

    // 1. Upsert single Legislation document into legislation subcollection FIRST
    if (added.length > 0 && primaryDocId) {
      const legislationData: Legislation = {
        name: name.trim(),
        ...(description && description.trim()
          ? { description: description.trim() }
          : fallbackDescription
            ? { description: fallbackDescription }
            : {}),
        ...(upperBillId ? { upperBillId } : {}),
        ...(lowerBillId ? { lowerBillId } : {}),
        stateBillIds,
        ocdBillIds,
      };

      const legislationDocRef = legislationCollectionRef.doc(primaryDocId);
      await legislationDocRef.set(legislationData, { merge: true });
    }

    // 2. Write raw OpenStatesBill payloads to ocd-bill subcollection
    for (const { billData, docId } of validBills) {
      const ocdBillDocRef = ocdBillCollectionRef.doc(docId);
      await ocdBillDocRef.set(
        {
          ...billData,
          updated_at: new Date().toISOString(),
        },
        { merge: true },
      );
    }

    return {
      message: `Processed ${billIds.length} bill(s): ${added.length} added, ${failed.length} failed.`,
      added,
      failed,
    };
  },
);
