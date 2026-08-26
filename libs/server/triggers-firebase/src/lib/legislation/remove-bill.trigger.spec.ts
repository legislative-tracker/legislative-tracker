import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeBill } from './remove-bill.trigger';

const mockDeleteLeg = vi.fn().mockResolvedValue(undefined);
const mockSetLeg = vi.fn().mockResolvedValue(undefined);
const mockDeleteOcd = vi.fn().mockResolvedValue(undefined);

vi.mock('../firebase.config', () => {
  return {
    db: {
      collection: (path: string) => {
        if (path.includes('/legislation')) {
          return {
            doc: (id: string) => ({
              get: vi.fn().mockResolvedValue({
                exists: id === 'NY-100',
                data: () => ({
                  name: 'Test Bill',
                  stateBillIds: { upper: 'S100', lower: 'A200' },
                  ocdBillIds: { upper: 'ocd-bill/U1', lower: 'ocd-bill/L1' },
                }),
              }),
              delete: mockDeleteLeg,
              set: mockSetLeg,
            }),
          };
        }
        if (path.includes('/ocd-bill')) {
          return {
            doc: (id: string) => ({
              get: vi.fn().mockResolvedValue({
                exists: id === 'U1' || id === 'L1',
              }),
              delete: mockDeleteOcd,
            }),
          };
        }
        return {};
      },
    },
  };
});

describe('removeBill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw permission-denied if user is not admin', async () => {
    const handler = (removeBill as any).run;
    await expect(
      handler({
        auth: { token: { admin: false } },
        data: { state: 'NY', billId: 'NY-100' },
      }),
    ).rejects.toThrow('Only admins can delete legislation.');
  });

  it('should remove specific chamber and update legislation if other chamber remains', async () => {
    const handler = (removeBill as any).run;
    const res = await handler({
      auth: { token: { admin: true } },
      data: { state: 'NY', billId: 'NY-100', chamber: 'upper' },
    });

    expect(res.id).toBe('NY-100');
    expect(mockDeleteOcd).toHaveBeenCalledTimes(1);
    expect(mockSetLeg).toHaveBeenCalledWith(
      {
        stateBillIds: { lower: 'A200' },
        ocdBillIds: { lower: 'ocd-bill/L1' },
      },
      { merge: true },
    );
  });

  it('should delete full legislation doc if all chambers are removed', async () => {
    const handler = (removeBill as any).run;
    const res = await handler({
      auth: { token: { admin: true } },
      data: { state: 'NY', billId: 'NY-100' },
    });

    expect(res.id).toBe('NY-100');
    expect(mockDeleteOcd).toHaveBeenCalledTimes(2);
    expect(mockDeleteLeg).toHaveBeenCalledTimes(1);
  });
});
