import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { db } from '../firebase.config';
import {
  OpenStatesBill,
  Legislation,
} from '@legislative-tracker/shared/models';
import { getJurisdictionCode } from '@legislative-tracker/server-util-core';
import { formatDocId } from '../helpers.util';
import { syncBillSponsorshipsToLegislators } from './sync-sponsorships.util';

/**
 * Firestore Trigger: Automatically updates legislator sponsorships whenever an ocd-bill document changes.
 */
export const onBillWritten = onDocumentWritten(
  'legislatures/{stateId}/ocd-bill/{billId}',
  async (event) => {
    const { stateId, billId } = event.params;
    const beforeBill = event.data?.before?.exists
      ? (event.data.before.data() as OpenStatesBill)
      : null;
    const afterBill = event.data?.after?.exists
      ? (event.data.after.data() as OpenStatesBill)
      : null;

    logger.info(
      `onBillWritten triggered for bill ${billId} in state ${stateId}`,
    );

    try {
      const stateKey = getJurisdictionCode(stateId);
      const ocdId = afterBill?.id || beforeBill?.id || billId;
      const cleanBillDocId = formatDocId(billId);
      const cleanOcdId = formatDocId(ocdId);

      let legislationId: string | undefined;

      // 1. Check direct document lookup
      const directRef = db
        .collection(`legislatures/${stateKey}/legislation`)
        .doc(cleanBillDocId);
      const directSnap = await directRef.get();
      if (directSnap.exists) {
        legislationId = directSnap.id;
      }

      // 2. If not found directly, find matching legislation record
      if (!legislationId) {
        const legSnapshot = await db
          .collection(`legislatures/${stateKey}/legislation`)
          .get();

        const normalize = (val?: string) =>
          val
            ? val
                .replace(/^(ocd-(bill|person)[\/:=])/, '')
                .replace(/[\s.-]/g, '')
                .toLowerCase()
            : '';

        const targetTokens = new Set(
          [
            cleanBillDocId,
            cleanOcdId,
            billId,
            ocdId,
            afterBill?.identifier,
            beforeBill?.identifier,
          ]
            .filter(Boolean)
            .map((s) => normalize(s!))
            .filter((s) => s.length > 0),
        );

        for (const doc of legSnapshot.docs) {
          const data = doc.data() as Legislation;
          const docTokens = [
            doc.id,
            data.id,
            data.ocdBillIds?.upper,
            data.ocdBillIds?.lower,
            data.upperBillId,
            data.lowerBillId,
            data.stateBillIds?.upper,
            data.stateBillIds?.lower,
          ]
            .filter(Boolean)
            .map((s) => normalize(s!))
            .filter((s) => s.length > 0);

          if (docTokens.some((token) => targetTokens.has(token))) {
            legislationId = doc.id;
            break;
          }
        }
      }

      if (!legislationId) {
        logger.warn(
          `No matching legislation document found for bill ${billId} in state ${stateId}`,
        );
        return;
      }

      await syncBillSponsorshipsToLegislators(
        db,
        stateId,
        billId,
        legislationId,
        beforeBill,
        afterBill,
      );
    } catch (error) {
      logger.error(
        `Failed to sync sponsorships for bill ${billId} (${stateId}):`,
        error,
      );
    }
  },
);
