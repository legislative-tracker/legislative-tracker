import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractSponsors, syncBillSponsorshipsToLegislators } from './sync-sponsorships';
import { Legislation } from '@legislative-tracker/shared/models';

vi.mock('firebase-functions/logger', () => ({
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

describe('sync-sponsorships', () => {
  describe('extractSponsors', () => {
    it('should return empty array for null/undefined bill', () => {
      expect(extractSponsors(null)).toEqual([]);
      expect(extractSponsors(undefined)).toEqual([]);
    });

    it('should extract sponsors from bill.sponsorships array', () => {
      const bill: Legislation = {
        id: 'S100',
        sponsorships: [
          {
            id: 'john-doe',
            name: 'John Doe',
            primary: true,
            classification: 'primary',
          },
          {
            id: 'jane-smith',
            name: 'Jane Smith',
            primary: false,
            classification: 'cosponsor',
          },
        ],
      };

      const sponsors = extractSponsors(bill);
      expect(sponsors.length).toBe(2);
      expect(sponsors).toEqual([
        {
          id: 'john-doe',
          name: 'John Doe',
          chamber: undefined,
          district: undefined,
          primary: true,
          classification: 'primary',
        },
        {
          id: 'jane-smith',
          name: 'Jane Smith',
          chamber: undefined,
          district: undefined,
          primary: false,
          classification: 'cosponsor',
        },
      ]);
    });

    it('should extract cosponsors from bill.cosponsors map', () => {
      const bill: Legislation = {
        id: 'S200',
        cosponsors: {
          Original: [
            {
              id: 'alice-wong',
              name: 'Alice Wong',
              chamber: 'SENATE',
              district: '10',
            },
          ],
        },
      };

      const sponsors = extractSponsors(bill);
      expect(sponsors.length).toBe(1);
      expect(sponsors[0]).toEqual({
        id: 'alice-wong',
        name: 'Alice Wong',
        chamber: 'SENATE',
        district: '10',
        primary: false,
        classification: 'cosponsor',
      });
    });
  });

  describe('syncBillSponsorshipsToLegislators', () => {
    let mockDb: any;
    let mockBulkWriter: any;
    let mockLegislators: any[];

    beforeEach(() => {
      mockBulkWriter = {
        set: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
      };

      mockLegislators = [
        {
          id: 'john-doe',
          ref: { id: 'john-doe' },
          data: () => ({
            id: 'john-doe',
            name: 'John Doe',
            chamber: 'SENATE',
            district: '1',
            sponsorships: [],
          }),
        },
        {
          id: 'jane-smith',
          ref: { id: 'jane-smith' },
          data: () => ({
            id: 'jane-smith',
            name: 'Jane Smith',
            chamber: 'ASSEMBLY',
            district: '2',
            sponsorships: [
              {
                id: 'S100',
                title: 'Old Title',
                version: 'Original',
                primary: false,
                classification: 'cosponsor',
              },
            ],
          }),
        },
      ];

      mockDb = {
        bulkWriter: () => mockBulkWriter,
        collection: vi.fn().mockReturnValue({
          get: vi.fn().mockImplementation(async () => ({
            empty: mockLegislators.length === 0,
            docs: mockLegislators,
          })),
        }),
      };
    });

    it('should add sponsorship to matching legislator when a bill is added', async () => {
      const afterBill: Legislation = {
        id: 'S100',
        title: 'New Infrastructure Act',
        current_version: 'A',
        sponsorships: [
          {
            id: 'john-doe',
            name: 'John Doe',
            primary: true,
            classification: 'primary',
          },
        ],
      };

      const result = await syncBillSponsorshipsToLegislators(
        mockDb,
        'NY',
        'S100',
        null,
        afterBill,
      );

      expect(result.updatedCount).toBe(1);
      expect(result.matchedLegislators).toEqual(['john-doe']);
      expect(mockBulkWriter.set).toHaveBeenCalledTimes(1);

      const callArgs = mockBulkWriter.set.mock.calls[0];
      expect(callArgs[1].sponsorships).toEqual([
        {
          id: 'S100',
          version: 'A',
          title: 'New Infrastructure Act',
          name: 'New Infrastructure Act',
          primary: true,
          classification: 'primary',
        },
      ]);
    });

    it('should update sponsorship and remove from legislators no longer sponsoring', async () => {
      const beforeBill: Legislation = {
        id: 'S100',
        title: 'Old Title',
        current_version: 'Original',
        sponsorships: [
          {
            id: 'jane-smith',
            name: 'Jane Smith',
            primary: false,
            classification: 'cosponsor',
          },
        ],
      };

      const afterBill: Legislation = {
        id: 'S100',
        title: 'New Title',
        current_version: 'A',
        sponsorships: [
          {
            id: 'john-doe',
            name: 'John Doe',
            primary: true,
            classification: 'primary',
          },
        ],
      };

      const result = await syncBillSponsorshipsToLegislators(
        mockDb,
        'NY',
        'S100',
        beforeBill,
        afterBill,
      );

      expect(result.updatedCount).toBe(2);
      expect(result.matchedLegislators).toContain('john-doe');
      expect(result.matchedLegislators).toContain('jane-smith');

      // Check jane-smith call (sponsorship removed)
      const janeCall = mockBulkWriter.set.mock.calls.find(
        (call: any) => call[0].id === 'jane-smith',
      );
      expect(janeCall[1].sponsorships).toEqual([]);

      // Check john-doe call (sponsorship added)
      const johnCall = mockBulkWriter.set.mock.calls.find(
        (call: any) => call[0].id === 'john-doe',
      );
      expect(johnCall[1].sponsorships.length).toBe(1);
    });
  });
});
