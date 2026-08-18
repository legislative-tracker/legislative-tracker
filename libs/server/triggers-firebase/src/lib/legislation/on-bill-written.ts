import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { db } from '../config';
import { OpenStatesBill } from '@legislative-tracker/shared/models';
import { syncBillSponsorshipsToLegislators } from './sync-sponsorships';

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
      await syncBillSponsorshipsToLegislators(
        db,
        stateId,
        billId,
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
