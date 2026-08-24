import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateBills } from './update-bills.util';
import * as openstatesDataAccess from '@legislative-tracker/server-data-access-openstates';
import { OpenStatesBill } from '@legislative-tracker/shared/models';

vi.mock('@legislative-tracker/server-data-access-openstates', () => ({
  getBillByOcdId: vi.fn(),
}));

describe('updateBills', () => {
  const mockBill1: OpenStatesBill = {
    id: 'ocd-bill/1',
    identifier: 'S100',
    title: 'Bill 1',
    session: '2025-2026',
    jurisdiction: {
      id: 'ocd-jurisdiction/country:us/state:ny/government',
      name: 'New York',
      classification: 'state',
    },
  };

  const mockBill2: OpenStatesBill = {
    id: 'ocd-bill/2',
    identifier: 'S200',
    title: 'Bill 2',
    session: '2025-2026',
    jurisdiction: {
      id: 'ocd-jurisdiction/country:us/state:ny/government',
      name: 'New York',
      classification: 'state',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should throw an error if openstatesApiKey is missing', async () => {
      await expect(
        updateBills({
          ocdIds: ['ocd-bill/1'],
          openstatesApiKey: '',
        }),
      ).rejects.toThrow('OpenStates API key is required');
    });

    it('should throw an error if ocdIds is not an array', async () => {
      await expect(
        updateBills({
          ocdIds: null as unknown as string[],
          openstatesApiKey: 'mock-key',
        }),
      ).rejects.toThrow('ocdIds must be an array');
    });

    it('should return an empty array if ocdIds is empty', async () => {
      const result = await updateBills({
        ocdIds: [],
        openstatesApiKey: 'mock-key',
      });
      expect(result).toEqual([]);
      expect(openstatesDataAccess.getBillByOcdId).not.toHaveBeenCalled();
    });

    it('should return an empty array if ocdIds contains only empty strings', async () => {
      const result = await updateBills({
        ocdIds: ['  ', ''],
        openstatesApiKey: 'mock-key',
      });
      expect(result).toEqual([]);
      expect(openstatesDataAccess.getBillByOcdId).not.toHaveBeenCalled();
    });
  });

  describe('Execution & Error Isolation', () => {
    it('should successfully update all bills when all API calls succeed', async () => {
      vi.mocked(openstatesDataAccess.getBillByOcdId)
        .mockResolvedValueOnce(mockBill1)
        .mockResolvedValueOnce(mockBill2);

      const result = await updateBills({
        ocdIds: ['ocd-bill/1', 'ocd-bill/2'],
        openstatesApiKey: 'mock-key',
      });

      expect(openstatesDataAccess.getBillByOcdId).toHaveBeenCalledTimes(2);
      expect(openstatesDataAccess.getBillByOcdId).toHaveBeenCalledWith(
        'ocd-bill/1',
        'mock-key',
      );
      expect(openstatesDataAccess.getBillByOcdId).toHaveBeenCalledWith(
        'ocd-bill/2',
        'mock-key',
      );
      expect(result).toEqual([mockBill1, mockBill2]);
    });

    it('should isolate errors and return partial success when one bill fetch fails', async () => {
      vi.mocked(openstatesDataAccess.getBillByOcdId)
        .mockResolvedValueOnce(mockBill1)
        .mockRejectedValueOnce(new Error('API 404 Not Found'));

      const result = await updateBills({
        ocdIds: ['ocd-bill/1', 'ocd-bill/invalid'],
        openstatesApiKey: 'mock-key',
      });

      expect(openstatesDataAccess.getBillByOcdId).toHaveBeenCalledTimes(2);
      expect(result).toEqual([mockBill1]);
    });

    it('should trim state parameter and handle optional state without throwing', async () => {
      vi.mocked(openstatesDataAccess.getBillByOcdId).mockResolvedValueOnce(
        mockBill1,
      );

      const result = await updateBills({
        ocdIds: ['ocd-bill/1'],
        state: ' ny ',
        openstatesApiKey: 'mock-key',
      });

      expect(result).toEqual([mockBill1]);
    });
  });
});
