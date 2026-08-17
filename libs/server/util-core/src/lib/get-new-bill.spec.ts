import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNewBill } from './get-new-bill';
import * as openstatesDataAccess from '@legislative-tracker/server-data-access-openstates';
import {
  clearRegistry,
  registerPlugin,
  LegislativePlugin,
} from '@legislative-tracker/plugins-core';
import { OpenStatesBill } from '@legislative-tracker/shared/models';

vi.mock('@legislative-tracker/server-data-access-openstates', () => ({
  getBillByStateId: vi.fn(),
}));

describe('getNewBill', () => {
  const mockBill: OpenStatesBill = {
    id: 'ocd-bill/12345',
    identifier: 'S1234',
    title: 'Test NY Bill',
    session: '2025-2026',
    jurisdiction: {
      id: 'ocd-jurisdiction/country:us/state:ny/government',
      name: 'New York',
      classification: 'state',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearRegistry();
  });

  describe('Validation', () => {
    it('should throw an error if state is missing', async () => {
      await expect(
        getNewBill({
          state: '',
          billId: 'S1234',
          openstatesApiKey: 'mock-key',
        }),
      ).rejects.toThrow('State/jurisdiction is required');
    });

    it('should throw an error if billId is missing', async () => {
      await expect(
        getNewBill({
          state: 'ny',
          billId: '',
          openstatesApiKey: 'mock-key',
        }),
      ).rejects.toThrow('Bill ID is required');
    });

    it('should throw an error if openstatesApiKey is missing', async () => {
      await expect(
        getNewBill({
          state: 'ny',
          billId: 'S1234',
          openstatesApiKey: '',
        }),
      ).rejects.toThrow('OpenStates API key is required');
    });

    it('should throw an error if session is missing and cannot be derived from a plugin', async () => {
      await expect(
        getNewBill({
          state: 'unknown-state',
          billId: 'S1234',
          openstatesApiKey: 'mock-key',
        }),
      ).rejects.toThrow(
        "Session is required and could not be determined for state 'unknown-state'",
      );
    });
  });

  describe('Session Derivation & Fetching', () => {
    it('should use explicit session when provided', async () => {
      vi.mocked(openstatesDataAccess.getBillByStateId).mockResolvedValueOnce(
        mockBill,
      );

      const result = await getNewBill({
        state: 'ny',
        session: '2025-2026',
        billId: 'S1234',
        openstatesApiKey: 'mock-api-key',
      });

      expect(openstatesDataAccess.getBillByStateId).toHaveBeenCalledWith(
        'ny',
        '2025-2026',
        'S1234',
        'mock-api-key',
      );
      expect(result).toEqual(mockBill);
    });

    it('should derive session automatically from a registered state plugin', async () => {
      const mockPlugin: LegislativePlugin = {
        metadata: {
          id: 'leg-us-ny',
          name: 'NY Plugin',
          version: '1.0.0',
          jurisdiction: {
            id: 'ocd-jurisdiction/country:us/state:ny/government',
            code: 'us-ny',
            name: 'New York',
            isBicameral: true,
            chambers: { upper: 'Senate', lower: 'Assembly' },
            currentSession: '2025-2026',
          },
          capabilities: { hasApi: true },
        },
        calculateCurrentSession: () => '2025-2026',
      };

      await registerPlugin(mockPlugin);
      vi.mocked(openstatesDataAccess.getBillByStateId).mockResolvedValueOnce(
        mockBill,
      );

      const result = await getNewBill({
        state: 'ny',
        billId: 'S1234',
        openstatesApiKey: 'mock-api-key',
      });

      expect(openstatesDataAccess.getBillByStateId).toHaveBeenCalledWith(
        'ny',
        '2025-2026',
        'S1234',
        'mock-api-key',
      );
      expect(result).toEqual(mockBill);
    });

    it('should fall back to OpenStates addBill when plugin connection is scaffolded', async () => {
      const mockPlugin: LegislativePlugin = {
        metadata: {
          id: 'leg-us-ny',
          name: 'NY Plugin',
          version: '1.0.0',
          jurisdiction: {
            id: 'ocd-jurisdiction/country:us/state:ny/government',
            code: 'us-ny',
            name: 'New York',
            isBicameral: true,
            chambers: { upper: 'Senate', lower: 'Assembly' },
            currentSession: '2025-2026',
          },
          capabilities: { hasApi: true },
        },
        calculateCurrentSession: () => '2025-2026',
      };

      await registerPlugin(mockPlugin);
      vi.mocked(openstatesDataAccess.getBillByStateId).mockResolvedValueOnce(
        mockBill,
      );

      const result = await getNewBill({
        state: 'ny',
        session: '2025-2026',
        billId: 'S1234',
        openstatesApiKey: 'mock-api-key',
      });

      expect(openstatesDataAccess.getBillByStateId).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBill);
    });
  });
});
