import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateMembers } from './update-members.util';
import * as openstatesDataAccess from '@legislative-tracker/server-data-access-openstates';
import { OpenStatesPerson } from '@legislative-tracker/shared/models';

vi.mock('@legislative-tracker/server-data-access-openstates', () => ({
  getMembers: vi.fn(),
}));

describe('updateMembers', () => {
  const mockPerson1: OpenStatesPerson = {
    id: 'ocd-person/1',
    name: 'Jane Doe',
    current_role: {
      title: 'Senator',
      org_classification: 'upper',
      district: '1',
    },
  };

  const mockPerson2: OpenStatesPerson = {
    id: 'ocd-person/2',
    name: 'John Smith',
    current_role: {
      title: 'Assembly Member',
      org_classification: 'lower',
      district: '2',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should throw an error if state is missing or empty', async () => {
      await expect(
        updateMembers({
          state: '',
          openstatesApiKey: 'mock-key',
        }),
      ).rejects.toThrow('State is required');

      await expect(
        updateMembers({
          state: '   ',
          openstatesApiKey: 'mock-key',
        }),
      ).rejects.toThrow('State is required');
    });

    it('should throw an error if openstatesApiKey is missing or empty', async () => {
      await expect(
        updateMembers({
          state: 'ny',
          openstatesApiKey: '',
        }),
      ).rejects.toThrow('OpenStates API key is required');

      await expect(
        updateMembers({
          state: 'ny',
          openstatesApiKey: '   ',
        }),
      ).rejects.toThrow('OpenStates API key is required');
    });
  });

  describe('Execution & Data Retrieval', () => {
    it('should call getMembers with trimmed parameters and return members', async () => {
      vi.mocked(openstatesDataAccess.getMembers).mockResolvedValueOnce([
        mockPerson1,
        mockPerson2,
      ]);

      const result = await updateMembers({
        state: '  ny  ',
        openstatesApiKey: '  mock-key  ',
      });

      expect(openstatesDataAccess.getMembers).toHaveBeenCalledTimes(1);
      expect(openstatesDataAccess.getMembers).toHaveBeenCalledWith(
        'ny',
        'mock-key',
      );
      expect(result).toEqual([mockPerson1, mockPerson2]);
    });

    it('should wrap errors thrown by getMembers with state context', async () => {
      vi.mocked(openstatesDataAccess.getMembers).mockRejectedValueOnce(
        new Error('API Rate Limit Exceeded'),
      );

      await expect(
        updateMembers({
          state: 'ny',
          openstatesApiKey: 'mock-key',
        }),
      ).rejects.toThrow(
        "Failed to update members for state 'ny': API Rate Limit Exceeded",
      );
    });
  });
});
