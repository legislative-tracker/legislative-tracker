import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onBillWritten } from './on-bill-written.trigger';
import { syncBillSponsorshipsToLegislators } from './sync-sponsorships.util';

const mockLegislationDoc = {
  id: 'LEG-1',
  exists: true,
  data: () => ({
    name: 'Clean Energy Act',
    ocdBillIds: { upper: 'ocd-bill/S100' },
    stateBillIds: { upper: 'S 100' },
  }),
};

const mockDb = {
  collection: vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue(mockLegislationDoc),
    }),
    get: vi.fn().mockResolvedValue({
      docs: [mockLegislationDoc],
    }),
  }),
};

vi.mock('../firebase.config', () => ({
  get db() {
    return mockDb;
  },
}));

vi.mock('./sync-sponsorships.util', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./sync-sponsorships.util')>();
  return {
    ...actual,
    syncBillSponsorshipsToLegislators: vi
      .fn()
      .mockResolvedValue({ updatedCount: 1, matchedLegislators: ['123'] }),
  };
});

describe('onBillWritten', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call syncBillSponsorshipsToLegislators with resolved legislationId when ocd-bill document is written', async () => {
    const handler = (onBillWritten as any).run;
    const event = {
      params: { stateId: 'NY', billId: 'S100' },
      data: {
        before: {
          exists: false,
          data: () => null,
        },
        after: {
          exists: true,
          data: () => ({
            id: 'ocd-bill/S100',
            identifier: 'S 100',
            title: 'Clean Energy Bill',
            sponsorships: [
              {
                name: 'Jane Doe',
                primary: true,
                classification: 'primary',
                entity_type: 'person',
                person: { id: 'ocd-person/P1', name: 'Jane Doe' },
              },
            ],
          }),
        },
      },
    };

    await handler(event);

    expect(syncBillSponsorshipsToLegislators).toHaveBeenCalledTimes(1);
    expect(syncBillSponsorshipsToLegislators).toHaveBeenCalledWith(
      expect.anything(),
      'NY',
      'S100',
      'LEG-1',
      null,
      expect.objectContaining({
        id: 'ocd-bill/S100',
        identifier: 'S 100',
      }),
    );
  });
});
