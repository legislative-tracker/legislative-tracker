import * as logger from 'firebase-functions/logger';
import {
  Legislation,
  Legislator,
  Sponsorship,
} from '@legislative-tracker/shared/models';
import { slugify } from '@legislative-tracker/server-util-core';

export interface SponsorInfo {
  id?: string;
  name?: string;
  chamber?: string;
  district?: string;
  primary?: boolean;
  classification?: string;
}

/**
 * Helper to extract all primary sponsors and cosponsors from a Legislation document
 */
export const extractSponsors = (bill?: Legislation | null): SponsorInfo[] => {
  if (!bill) return [];

  const sponsorsMap = new Map<string, SponsorInfo>();

  const addSponsor = (info: SponsorInfo) => {
    const rawName = info.name || '';
    const key = info.id || (rawName ? slugify(rawName) : '');
    if (!key) return;

    const existing = sponsorsMap.get(key);
    if (!existing) {
      sponsorsMap.set(key, { ...info });
    } else {
      if (info.primary) {
        existing.primary = true;
        existing.classification = info.classification || 'primary';
      }
      if (info.chamber && !existing.chamber) existing.chamber = info.chamber;
      if (info.district && !existing.district)
        existing.district = info.district;
    }
  };

  // 1. Process bill.sponsorships array if present
  if (Array.isArray(bill.sponsorships)) {
    bill.sponsorships.forEach((s: any) => {
      if (typeof s === 'object' && s !== null) {
        const isPrimary = Boolean(s.primary || s.classification === 'primary');
        addSponsor({
          id: s.id,
          name: s.name,
          chamber: s.chamber,
          district: s.district,
          primary: isPrimary,
          classification: isPrimary
            ? 'primary'
            : s.classification || 'cosponsor',
        });
      }
    });
  }

  // 2. Process bill.cosponsors version map if present
  if (bill.cosponsors && typeof bill.cosponsors === 'object') {
    Object.values(bill.cosponsors).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((c) => {
          addSponsor({
            id: c.id,
            name: c.name,
            chamber: c.chamber,
            district: c.district,
            primary: false,
            classification: 'cosponsor',
          });
        });
      }
    });
  }

  // 3. Process top-level bill.sponsor if present
  const rawSponsor = (bill as any).sponsor;
  if (rawSponsor && typeof rawSponsor === 'object') {
    const member = rawSponsor.member || rawSponsor;
    const name = member.fullName || member.name;
    const id = member.id || (name ? slugify(name) : undefined);
    if (name || id) {
      addSponsor({
        id,
        name,
        chamber: member.chamber,
        district: member.districtCode || member.district,
        primary: true,
        classification: 'primary',
      });
    }
  }

  return Array.from(sponsorsMap.values());
};

/**
 * Synchronizes a bill's sponsorship information with the relevant legislator documents in Firestore.
 */
export const syncBillSponsorshipsToLegislators = async (
  db: FirebaseFirestore.Firestore,
  stateId: string,
  billId: string,
  beforeBill?: Legislation | null,
  afterBill?: Legislation | null,
): Promise<{ updatedCount: number; matchedLegislators: string[] }> => {
  const beforeSponsors = extractSponsors(beforeBill);
  const afterSponsors = extractSponsors(afterBill);

  if (beforeSponsors.length === 0 && afterSponsors.length === 0) {
    return { updatedCount: 0, matchedLegislators: [] };
  }

  const legislatorsSnapshot = await db
    .collection(`legislatures/${stateId}/legislators`)
    .get();

  if (legislatorsSnapshot.empty) {
    logger.warn(
      `No legislators found in state ${stateId} to sync sponsorships for bill ${billId}`,
    );
    return { updatedCount: 0, matchedLegislators: [] };
  }

  // Build maps of after & before sponsors by key
  const afterMap = new Map<string, SponsorInfo>();
  afterSponsors.forEach((s) => {
    const key = s.id || (s.name ? slugify(s.name) : '');
    if (key) afterMap.set(key, s);
  });

  const beforeMap = new Map<string, SponsorInfo>();
  beforeSponsors.forEach((s) => {
    const key = s.id || (s.name ? slugify(s.name) : '');
    if (key) beforeMap.set(key, s);
  });

  const bulkWriter = db.bulkWriter();
  let updatedCount = 0;
  const matchedLegislators: string[] = [];

  const effectiveBillId =
    afterBill?.identifier ||
    afterBill?.id ||
    beforeBill?.identifier ||
    beforeBill?.id ||
    billId;
  const billTitle = afterBill?.title || beforeBill?.title || '';
  const billVersion =
    afterBill?.current_version ||
    afterBill?.version ||
    beforeBill?.current_version ||
    beforeBill?.version ||
    '';

  legislatorsSnapshot.docs.forEach((doc) => {
    const leg = doc.data() as Legislator;
    const docId = doc.id;
    const legName = leg.name || '';
    const legSlug = slugify(legName);
    const legChamber = leg.chamber?.toUpperCase();
    const legDistrict = leg.district ? String(leg.district) : undefined;

    // Check matching against sponsor entries
    let matchedAfter: SponsorInfo | undefined;
    let matchedBefore: SponsorInfo | undefined;

    afterMap.forEach((s, key) => {
      if (
        key === docId ||
        key === legSlug ||
        (s.name && slugify(s.name) === legSlug) ||
        (s.chamber &&
          s.district &&
          legChamber === s.chamber.toUpperCase() &&
          legDistrict === String(s.district))
      ) {
        matchedAfter = s;
      }
    });

    beforeMap.forEach((s, key) => {
      if (
        key === docId ||
        key === legSlug ||
        (s.name && slugify(s.name) === legSlug) ||
        (s.chamber &&
          s.district &&
          legChamber === s.chamber.toUpperCase() &&
          legDistrict === String(s.district))
      ) {
        matchedBefore = s;
      }
    });

    if (!matchedAfter && !matchedBefore) {
      return;
    }

    const existingSponsorships: Sponsorship[] = Array.isArray(leg.sponsorships)
      ? leg.sponsorships
      : [];
    // Remove previous sponsorship entry for this bill
    const filteredSponsorships = existingSponsorships.filter(
      (s) => s.id !== billId && s.id !== effectiveBillId,
    );

    if (matchedAfter) {
      const isPrimary = Boolean(matchedAfter.primary);
      const sponsorshipEntry: Sponsorship = {
        id: effectiveBillId,
        version: billVersion,
        title: billTitle,
        name: billTitle,
        primary: isPrimary,
        classification: isPrimary
          ? 'primary'
          : matchedAfter.classification || 'cosponsor',
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
    `Synced sponsorships for bill ${billId} (${stateId}): updated ${updatedCount} legislator(s).`,
  );

  return { updatedCount, matchedLegislators };
};
