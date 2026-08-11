import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

// App imports
import {
  db,
  getBillUpdates,
  nySenateKey,
} from "@legislative-tracker/server-firebase/data-access";
import { performLegislationUpdate } from "./service";

/**
 * Adds a Bill & Pulls Updates (Callable)
 */
export const addBill = onCall({ secrets: [nySenateKey] }, async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can add legislation.",
    );
  }

  const { state, bill } = request.data;
  if (!state || !bill || !bill.id) {
    throw new HttpsError("invalid-argument", "Invalid data.");
  }

  const billRef = db
    .collection(`legislatures/${state}/legislation`)
    .doc(bill.id);

  try {
    await billRef.set(bill, { merge: true });
    logger.info(`Initial bill stub created for ${bill.id}`);

    try {
      logger.info(
        `Attempting to fetch details for ${bill.id} from ${state}...`,
      );

      const updates = await getBillUpdates({ id: state, bills: [bill.id] });

      if (updates.bills && updates.bills.length > 0) {
        const fullBillData = updates.bills[0];
        await billRef.set(fullBillData, { merge: true });
        logger.info(`Successfully fetched and saved full data for ${bill.id}`);

        return {
          message: `Success! Bill ${bill.id} added and details fetched.`,
          path: billRef.path,
          fetched: true,
        };
      }
    } catch (apiError) {
      logger.warn(
        `Bill added, but failed to fetch remote details: ${apiError}`,
      );

      return {
        message: `Success! Bill ${bill.id} added (details pending nightly update).`,
        path: billRef.path,
        fetched: false,
      };
    }

    return { message: `Success! Bill ${bill.id} added.`, path: billRef.path };
  } catch (error) {
    logger.error("Database write failed", error);
    throw new HttpsError("internal", "Failed to save bill.");
  }
});

/**
 * Deletes a Bill (Callable)
 */
export const removeBill = onCall(async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can delete legislation.",
    );
  }
  const { state, billId } = request.data;
  if (!state || !billId)
    throw new HttpsError("invalid-argument", "Invalid data.");

  try {
    const billRef = db
      .collection(`legislatures/${state}/legislation`)
      .doc(billId);
    await billRef.delete();
    return { message: `Success! Bill ${billId} removed.`, id: billId };
  } catch (error) {
    throw new HttpsError("internal", "Failed to delete bill.");
  }
});

/**
 * Scheduled Nightly Update
 */
export const nightlyUpdate = onSchedule(
  {
    schedule: "0 5 * * *",
    timeZone: "America/New_York",
    retryCount: 3,
    secrets: [nySenateKey],
  },
  async () => {
    logger.info("🌙 Starting nightly legislation update...");
    await performLegislationUpdate();
    logger.info("✅ Nightly update finished.");
  },
);

/**
 * Manual Trigger for Debugging (HTTPS)
 */
export const manualUpdate = onRequest(
  { secrets: [nySenateKey] },
  async (request, response) => {
    try {
      const data = await performLegislationUpdate();
      response.send({
        status: "success",
        timestamp: new Date().toISOString(),
        data: data,
      });
    } catch (error: unknown) {
      logger.error("HTTP Update Failed", error);
      response.status(500).send({ error: error });
    }
  },
);
