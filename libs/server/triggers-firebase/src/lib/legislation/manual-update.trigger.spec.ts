import { describe, it, expect, vi, beforeEach } from 'vitest';
import { manualUpdate } from './manual-update.trigger';
import { performLegislationUpdate } from './legislation.service';

vi.mock('../firebase.config', () => ({
  dataAccessOpenStatesKey: {
    value: vi.fn().mockReturnValue('test-api-key'),
  },
  pluginLegUsNyKey: {
    value: vi.fn().mockReturnValue('test-plugin-key'),
  },
}));

vi.mock('./legislation.service', () => ({
  performLegislationUpdate: vi.fn(),
}));

describe('legislation manualUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw permission-denied if user is unauthenticated', async () => {
    const handler = (manualUpdate as any).run;
    await expect(handler({ auth: undefined })).rejects.toThrow(
      'Only admins can perform manual legislation updates.',
    );
  });

  it('should throw permission-denied if user is not admin', async () => {
    const handler = (manualUpdate as any).run;
    await expect(
      handler({
        auth: { token: { admin: false } },
      }),
    ).rejects.toThrow('Only admins can perform manual legislation updates.');
  });

  it('should execute performLegislationUpdate when user has admin claims', async () => {
    const mockData = [{ state: 'NY', matched: 5, updated: 5 }];
    vi.mocked(performLegislationUpdate).mockResolvedValueOnce(mockData as any);

    const handler = (manualUpdate as any).run;
    const result = await handler({
      auth: { token: { admin: true } },
    });

    expect(performLegislationUpdate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('success');
    expect(result.timestamp).toBeDefined();
    expect(result.data).toEqual(mockData);
  });

  it('should rethrow errors as HttpsError if performLegislationUpdate fails', async () => {
    vi.mocked(performLegislationUpdate).mockRejectedValueOnce(
      new Error('Failed to reach OpenStates API'),
    );

    const handler = (manualUpdate as any).run;
    await expect(
      handler({
        auth: { token: { admin: true } },
      }),
    ).rejects.toThrow('Failed to reach OpenStates API');
  });
});
