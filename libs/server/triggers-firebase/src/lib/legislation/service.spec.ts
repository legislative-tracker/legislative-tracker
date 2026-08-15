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
  };
});

vi.mock('@legislative-tracker/server-util-core', () => ({
  getBillUpdates: vi
    .fn()
    .mockImplementation(async (item: { id: string; bills: string[] }) => ({
      id: item.id,
      bills: item.bills.map((id) => ({ id, title: 'Updated Title' })),
    })),
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
            docs: [{ id: 'ny' }],
          }),
        };
      }
      if (path === 'legislatures/ny/legislation') {
        return {
          get: vi.fn().mockResolvedValue({
            docs: [{ id: 'S100' }, { id: 'A200' }],
          }),
          doc: vi
            .fn()
            .mockImplementation((id: string) => ({
              id,
              path: `legislatures/ny/legislation/${id}`,
            })),
        };
      }
      return { get: vi.fn().mockResolvedValue({ docs: [] }) };
    });

    const updates = await performLegislationUpdate();

    expect(updates.length).toBe(1);
    expect(updates[0].id).toBe('ny');
    expect(updates[0].bills).toHaveLength(2);
    expect(mockBulkWriter.set).toHaveBeenCalledTimes(2);
    expect(mockBulkWriter.close).toHaveBeenCalledTimes(1);
  });
});
