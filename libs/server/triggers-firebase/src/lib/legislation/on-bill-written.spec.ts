import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onBillWritten } from './on-bill-written';
import { syncBillSponsorshipsToLegislators } from './sync-sponsorships';

vi.mock('../config', () => ({
  db: {},
}));

vi.mock('./sync-sponsorships', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./sync-sponsorships')>();
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

  it('should call syncBillSponsorshipsToLegislators when ocd-bill document is written', async () => {
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
      null,
      expect.objectContaining({
        id: 'ocd-bill/S100',
        identifier: 'S 100',
      }),
    );
  });
});
