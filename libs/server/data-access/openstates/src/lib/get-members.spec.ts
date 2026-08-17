import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMembers } from './get-members';

describe('getMembers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should fetch single page of members', async () => {
    const mockResponse = {
      results: [
        {
          id: 'ocd-person/123',
          name: 'Jane Doe',
          family_name: 'Doe',
          given_name: 'Jane',
          email: 'jane.doe@example.com',
        },
      ],
      pagination: {
        per_page: 50,
        page: 1,
        max_page: 1,
        total_items: 1,
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      }),
    );

    const members = await getMembers('ny', 'test-api-key');

    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      id: 'ocd-person/123',
      name: 'Jane Doe',
      family_name: 'Doe',
      given_name: 'Jane',
      email: 'jane.doe@example.com',
    });
  });

  it('should automatically handle pagination across multiple pages', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 'ocd-person/1', name: 'Member 1' }],
          pagination: { per_page: 1, page: 1, max_page: 2, total_items: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: 'ocd-person/2', name: 'Member 2' }],
          pagination: { per_page: 1, page: 2, max_page: 2, total_items: 2 },
        }),
      });

    vi.stubGlobal('fetch', mockFetch);

    const members = await getMembers('ny', 'test-api-key');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(members).toHaveLength(2);
    expect(members[0].name).toBe('Member 1');
    expect(members[1].name).toBe('Member 2');
  });

  it('should throw an error if HTTP response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      }),
    );

    await expect(getMembers('ny', 'invalid-key')).rejects.toThrow(
      'OpenStates API error (401): Unauthorized',
    );
  });
});
