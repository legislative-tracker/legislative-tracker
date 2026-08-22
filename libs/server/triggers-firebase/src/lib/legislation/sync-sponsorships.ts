import * as logger from 'firebase-functions/logger';
import {
  Legislation,
  OpenStatesBill,
  OpenStatesPerson,
  PersonSponsorship,
} from '@legislative-tracker/shared/models';
import { getJurisdictionCode } from '@legislative-tracker/server-util-core';
import { formatDocId } from '../helpers';

export interface SponsorInfo {
  personId?: string;
  name?: string;
  primary?: boolean;
  classification?: string;
}

/**
 * Helper to extract all sponsors from an OpenStatesBill payload
 */
export const extractSponsors = (
  bill?: OpenStatesBill | null,
): SponsorInfo[] => {
  if (!bill || !Array.isArray(bill.sponsorships)) return [];

  const sponsorsMap = new Map<string, SponsorInfo>();

  bill.sponsorships.forEach((s) => {
    if (typeof s === 'object' && s !== null) {
      const personId = s.person?.id || s.id;
      const rawName = s.name || s.person?.name || '';
      const key = personId ? formatDocId(personId) : rawName;
      if (!key) return;

      const isPrimary = Boolean(s.primary || s.classification === 'primary');
      sponsorsMap.set(key, {
        personId: personId ? formatDocId(personId) : undefined,
        name: rawName,
        primary: isPrimary,
        classification: s.classification,
      });
    }
  });

  return Array.from(sponsorsMap.values());
};

/**
 * Synchronizes an OpenStates bill's sponsorship information with ocd-person documents in Firestore.
 */
export const syncBillSponsorshipsToLegislators = async (
  db: FirebaseFirestore.Firestore,
  stateId: string,
  billId: string,
  legislationId: string,
  beforeBill?: OpenStatesBill | null,
  afterBill?: OpenStatesBill | null,
): Promise<{ updatedCount: number; matchedLegislators: string[] }> => {
  const beforeSponsors = extractSponsors(beforeBill);
  const afterSponsors = extractSponsors(afterBill);

  if (beforeSponsors.length === 0 && afterSponsors.length === 0) {
    return { updatedCount: 0, matchedLegislators: [] };
  }

  const stateKey = getJurisdictionCode(stateId);
  const legislationDocRef = db.doc(
    `legislatures/${stateKey}/legislation/${legislationId}`,
  );
  const legislationSnap = await legislationDocRef.get();

  if (!legislationSnap.exists) {
    logger.warn(
      `No legislation record found with ID ${legislationId} in state ${stateId} to sync sponsorships for bill ${billId}`,
    );
    return { updatedCount: 0, matchedLegislators: [] };
  }

  const legislationData = legislationSnap.data() as Legislation | undefined;
  const billName = legislationData?.name;

  if (!billName) {
    logger.warn(
      `Legislation record ${legislationId} in state ${stateId} has no name to sync sponsorships for bill ${billId}`,
    );
    return { updatedCount: 0, matchedLegislators: [] };
  }

  const peopleSnapshot = await db
    .collection(`legislatures/${stateKey}/ocd-person`)
    .get();

  if (peopleSnapshot.empty) {
    logger.warn(
      `No ocd-person records found in state ${stateId} to sync sponsorships for bill ${billId}`,
    );
    return { updatedCount: 0, matchedLegislators: [] };
  }

  const ocdBillId = afterBill?.id || beforeBill?.id || billId;
  const stateBillId = afterBill?.identifier || beforeBill?.identifier || '';

  // Build lookup maps for after & before sponsors
  const afterByPersonId = new Map<string, SponsorInfo>();
  const afterByName = new Map<string, SponsorInfo>();
  afterSponsors.forEach((s) => {
    if (s.personId) afterByPersonId.set(s.personId, s);
    if (s.name) afterByName.set(s.name.toLowerCase(), s);
  });

  const beforeByPersonId = new Map<string, SponsorInfo>();
  const beforeByName = new Map<string, SponsorInfo>();
  beforeSponsors.forEach((s) => {
    if (s.personId) beforeByPersonId.set(s.personId, s);
    if (s.name) beforeByName.set(s.name.toLowerCase(), s);
  });

  const bulkWriter = db.bulkWriter();
  let updatedCount = 0;
  const matchedLegislators: string[] = [];

  peopleSnapshot.docs.forEach((doc) => {
    const person = doc.data() as OpenStatesPerson;
    const docId = doc.id;
    const cleanPersonId = person.id ? formatDocId(person.id) : docId;
    const personName = (person.name || '').toLowerCase();

    const matchedAfter =
      afterByPersonId.get(docId) ||
      afterByPersonId.get(cleanPersonId) ||
      afterByName.get(personName);

    const matchedBefore =
      beforeByPersonId.get(docId) ||
      beforeByPersonId.get(cleanPersonId) ||
      beforeByName.get(personName);

    if (!matchedAfter && !matchedBefore) {
      return;
    }

    const existingSponsorships: PersonSponsorship[] = Array.isArray(
      person.sponsorships,
    )
      ? person.sponsorships
      : [];

    // Filter out existing entry for this legislation
    const filteredSponsorships = existingSponsorships.filter(
      (s) => s.legislationId !== legislationId,
    );

    if (matchedAfter) {
      const sponsorshipEntry: PersonSponsorship = {
        legislationId,
        billName,
        stateBillId,
        ocdBillId,
      };
      filteredSponsorships.push(sponsorshipEntry);
    }

    bulkWriter.set(
      doc.ref,
      {
        sponsorships: filteredSponsorships,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );

    matchedLegislators.push(docId);
    updatedCount++;
  });

  await bulkWriter.close();
  logger.info(
    `Synced sponsorships for bill ${billId} (${stateId}): updated ${updatedCount} ocd-person record(s).`,
  );

  return { updatedCount, matchedLegislators };
};
