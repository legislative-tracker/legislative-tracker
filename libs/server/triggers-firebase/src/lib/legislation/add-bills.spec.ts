import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addBills } from './add-bills';
import { getNewBill } from '@legislative-tracker/server-util-core';

vi.mock('../config', () => {
  const mockSet = vi.fn().mockResolvedValue(undefined);
  const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
  const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });
  return {
    db: {
      collection: mockCollection,
    },
    dataAccessOpenStatesKey: {
      value: vi.fn().mockReturnValue('test-key'),
    },
  };
});

vi.mock('@legislative-tracker/server-util-core', () => ({
  getJurisdictionCode: vi
    .fn()
    .mockImplementation((state: string) => state.toLowerCase()),
  getNewBill: vi
    .fn()
    .mockImplementation(async (options: { billId: string }) => ({
      id: `ocd-bill/${options.billId}`,
      identifier: options.billId,
      title: `Test Bill ${options.billId}`,
      from_organization: { classification: 'upper', name: 'Senate' },
    })),
}));

describe('addBills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw permission-denied if user is not admin', async () => {
    const handler = (addBills as any).run;
    await expect(
      handler({
        auth: { token: { admin: false } },
        data: { name: 'Clean Energy Act', state: 'NY', billIds: ['S100'] },
      }),
    ).rejects.toThrow('Only admins can add legislation.');
  });

  it('should throw invalid-argument if required parameters are missing', async () => {
    const handler = (addBills as any).run;

    await expect(
      handler({
        auth: { token: { admin: true } },
        data: { name: '', state: 'NY', billIds: ['S100'] },
      }),
    ).rejects.toThrow(
      'Name, state, and a non-empty array of billIds are required.',
    );

    await expect(
      handler({
        auth: { token: { admin: true } },
        data: { name: 'Test', state: '', billIds: ['S100'] },
      }),
    ).rejects.toThrow(
      'Name, state, and a non-empty array of billIds are required.',
    );

    await expect(
      handler({
        auth: { token: { admin: true } },
        data: { name: 'Test', state: 'NY', billIds: [] },
      }),
    ).rejects.toThrow(
      'Name, state, and a non-empty array of billIds are required.',
    );
  });

  it('should process array of billIds and save to ocd-bill and legislation', async () => {
    const handler = (addBills as any).run;
    const res = await handler({
      auth: { token: { admin: true } },
      data: {
        name: 'Clean Energy Act',
        description: 'Promotes clean energy incentives',
        state: 'NY',
        billIds: ['S100', 'S200'],
      },
    });

    expect(res.added).toEqual(['S100', 'S200']);
    expect(res.failed).toHaveLength(0);
  });

  it('should capture isolated errors for failed bill fetches', async () => {
    const mockedGetNewBill = vi.mocked(getNewBill);
    mockedGetNewBill.mockImplementationOnce(async () => {
      throw new Error('API Timeout');
    });

    const handler = (addBills as any).run;
    const res = await handler({
      auth: { token: { admin: true } },
      data: {
        name: 'Clean Energy Act',
        state: 'NY',
        billIds: ['BAD1', 'S200'],
      },
    });

    expect(res.added).toEqual(['S200']);
    expect(res.failed).toEqual([{ billId: 'BAD1', error: 'API Timeout' }]);
  });
});
