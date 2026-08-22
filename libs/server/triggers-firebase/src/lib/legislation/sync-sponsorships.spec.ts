import { describe, it, expect, vi } from 'vitest';
import {
  extractSponsors,
  syncBillSponsorshipsToLegislators,
} from './sync-sponsorships';
import { OpenStatesBill } from '@legislative-tracker/shared/models';

describe('sync-sponsorships', () => {
  describe('extractSponsors', () => {
    it('should return empty array if bill or sponsorships are missing', () => {
      expect(extractSponsors(null)).toEqual([]);
      expect(extractSponsors({} as any)).toEqual([]);
    });

    it('should extract sponsor info from OpenStatesBill sponsorships array', () => {
      const bill: OpenStatesBill = {
        id: 'ocd-bill/123',
        identifier: 'S100',
        title: 'Title',
        sponsorships: [
          {
            name: 'Jane Doe',
            entity_type: 'person',
            primary: true,
            classification: 'primary',
            person: { id: 'ocd-person/P1', name: 'Jane Doe' },
          },
        ],
      } as any;

      const sponsors = extractSponsors(bill);
      expect(sponsors).toHaveLength(1);
      expect(sponsors[0]).toEqual({
        personId: 'P1',
        name: 'Jane Doe',
        primary: true,
        classification: 'primary',
      });
    });
  });

  describe('syncBillSponsorshipsToLegislators', () => {
    it('should return 0 updated if no before or after sponsors exist', async () => {
      const db = {} as any;
      const res = await syncBillSponsorshipsToLegislators(
        db,
        'NY',
        'S100',
        null,
        null,
      );
      expect(res).toEqual({ updatedCount: 0, matchedLegislators: [] });
    });

    it('should update ocd-person document sponsorships array for matching sponsors', async () => {
      const mockSet = vi.fn();
      const mockClose = vi.fn().mockResolvedValue(undefined);
      const mockBulkWriter = {
        set: mockSet,
        close: mockClose,
      };

      const mockPersonDoc = {
        id: 'P1',
        ref: 'ref-P1',
        data: () => ({
          id: 'ocd-person/P1',
          name: 'Jane Doe',
          sponsorships: [],
        }),
      };

      const db = {
        collection: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            empty: false,
            docs: [mockPersonDoc],
          }),
        }),
        bulkWriter: vi.fn().mockReturnValue(mockBulkWriter),
      } as any;

      const afterBill: OpenStatesBill = {
        id: 'ocd-bill/S100',
        identifier: 'S 100',
        title: 'Clean Energy Act',
        sponsorships: [
          {
            name: 'Jane Doe',
            entity_type: 'person',
            primary: true,
            classification: 'primary',
            person: { id: 'ocd-person/P1', name: 'Jane Doe' },
          },
        ],
      } as any;

      const res = await syncBillSponsorshipsToLegislators(
        db,
        'NY',
        'S100',
        null,
        afterBill,
      );

      expect(res.updatedCount).toBe(1);
      expect(res.matchedLegislators).toEqual(['P1']);
      expect(mockSet).toHaveBeenCalledWith(
        'ref-P1',
        expect.objectContaining({
          sponsorships: [
            {
              billName: 'S 100',
              stateBillId: 'S 100',
              ocdBillId: 'ocd-bill/S100',
            },
          ],
        }),
        { merge: true },
      );
    });
  });
});
