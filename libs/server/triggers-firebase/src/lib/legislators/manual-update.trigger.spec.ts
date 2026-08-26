import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manualUpdate } from './manual-update.trigger';
import { updateLegislators } from './legislators.service';

vi.mock('../firebase.config', () => ({
  dataAccessOpenStatesKey: {
    value: vi.fn().mockReturnValue('mock-openstates-key'),
  },
  pluginLegUsNyKey: {
    value: vi.fn().mockReturnValue('mock-ny-key'),
  },
}));

vi.mock('./legislators.service', () => ({
  updateLegislators: vi.fn(),
}));

describe('legislators manualUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw permission-denied if user is unauthenticated', async () => {
    const handler = (manualUpdate as any).run;
    await expect(handler({ auth: undefined })).rejects.toThrow(
      'Only admins can perform manual legislator updates.',
    );
  });

  it('should throw permission-denied if user is not admin', async () => {
    const handler = (manualUpdate as any).run;
    await expect(
      handler({
        auth: { token: { admin: false } },
      }),
    ).rejects.toThrow('Only admins can perform manual legislator updates.');
  });

  it('should execute updateLegislators when user has admin claims', async () => {
    const mockResults = [{ state: 'NY', totalCount: 150, writtenCount: 150 }];
    vi.mocked(updateLegislators).mockResolvedValueOnce(mockResults as any);

    const handler = (manualUpdate as any).run;
    const result = await handler({
      auth: { token: { admin: true } },
    });

    expect(updateLegislators).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('success');
    expect(result.timestamp).toBeDefined();
    expect(result.results).toEqual(mockResults);
  });

  it('should rethrow errors as HttpsError if updateLegislators fails', async () => {
    vi.mocked(updateLegislators).mockRejectedValueOnce(
      new Error('Failed to update legislators in Firestore'),
    );

    const handler = (manualUpdate as any).run;
    await expect(
      handler({
        auth: { token: { admin: true } },
      }),
    ).rejects.toThrow('Failed to update legislators in Firestore');
  });
});
