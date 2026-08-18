import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performLegislationUpdate } from './service';

vi.mock('../config', () => {
  const mockBulkWriter = {
    set: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  return {
    db: {
      collection: vi.fn(),
      bulkWriter: vi.fn().mockReturnValue(mockBulkWriter),
    },
    dataAccessOpenStatesKey: {
      value: vi.fn().mockReturnValue('test-api-key'),
    },
  };
});

vi.mock('@legislative-tracker/server-util-core', () => ({
  getJurisdictionCode: vi.fn().mockImplementation((state: string) => state),
  updateBills: vi
    .fn()
    .mockImplementation(async (options: { ocdIds: string[] }) =>
      options.ocdIds.map((id) => ({
        id,
        title: 'Updated Bill Title',
      })),
    ),
}));

describe('performLegislationUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process legislation updates for registered legislatures in firestore', async () => {
    const { db } = await import('../config');
    const mockBulkWriter = db.bulkWriter();

    (db.collection as any).mockImplementation((path: string) => {
      if (path === 'legislatures') {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [{ id: 'NY', data: () => ({ name: 'New York' }) }],
          }),
        };
      }
      if (path === 'legislatures/NY/ocd-bill') {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [
              {
                id: 'ocd-bill_1111',
                data: () => ({ id: 'ocd-bill/1111' }),
              },
              {
                id: 'ocd-bill_2222',
                data: () => ({ id: 'ocd-bill/2222' }),
              },
            ],
          }),
          doc: vi.fn().mockImplementation((id: string) => ({
            id,
            path: `legislatures/NY/ocd-bill/${id}`,
          })),
        };
      }
      return { get: vi.fn().mockResolvedValue({ docs: [] }) };
    });

    const results = await performLegislationUpdate();

    expect(results.length).toBe(1);
    expect(results[0].state).toBe('NY');
    expect(results[0].matched).toBe(2);
    expect(mockBulkWriter.set).toHaveBeenCalledTimes(2);
    expect(mockBulkWriter.close).toHaveBeenCalledTimes(1);
  });
});
