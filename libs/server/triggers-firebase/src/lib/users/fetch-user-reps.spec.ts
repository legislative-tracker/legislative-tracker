import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserReps } from './fetch-user-reps';

// Mock dependencies before importing handler
vi.mock('../config', () => ({
  db: {
    collection: vi.fn(),
  },
  dataAccessOpenStatesKey: { value: vi.fn().mockReturnValue('test-os-key') },
  dataAccessGoogleMapsKey: { value: vi.fn().mockReturnValue('test-maps-key') },
}));

vi.mock('@legislative-tracker/server-data-access-google-maps', () => ({
  getGeocode: vi.fn(),
}));

describe('fetchUserReps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if address is missing', async () => {
    await expect(
      (fetchUserReps as any).run({
        data: {},
        auth: { uid: 'user123' },
      }),
    ).rejects.toThrow('Address required.');
  });

  it('should throw error if user is unauthenticated', async () => {
    await expect(
      (fetchUserReps as any).run({
        data: { address: '123 Main St' },
        auth: null,
      }),
    ).rejects.toThrow('User ID required.');
  });
});
