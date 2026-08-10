import { db, getBillUpdates } from "@legislative-tracker/server-firebase/data-access";

/**
 * Core business logic for updating legislation from 3rd party APIs
 */
export const performLegislationUpdate = async () => {
  const legislaturesSnapshot = await db.collection("legislatures").get();
  const legislaturesList = legislaturesSnapshot.docs.map((doc) => doc.id);

  const pendingLookups = legislaturesList.map(async (legislature) => {
    const snapshot = await db
      .collection(`legislatures/${legislature}/legislation`)
      .get();
    const billList = snapshot.docs.map((doc) => doc.id);
    return { id: legislature, bills: billList };
  });

  const billListByLegislature = await Promise.all(pendingLookups);
  const updates = await Promise.all(
    billListByLegislature.map((o) => getBillUpdates(o))
  );

  const bulkWriter = db.bulkWriter();

  updates.forEach((u) => {
    const cRef = db.collection(`legislatures/${u.id}/legislation`);
    u.bills.forEach((bill) => {
      const docRef = cRef.doc(bill.id);
      bulkWriter.set(docRef, bill, { merge: true });
    });
  });

  await bulkWriter.close();
  return updates;
};
