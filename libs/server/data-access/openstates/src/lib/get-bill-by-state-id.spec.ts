import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBillByStateId } from './get-bill-by-state-id';
import { DEFAULT_BILL_INCLUDES } from './constants';

describe('getBillByStateId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should fetch bill by state, session, and billId with default includes', async () => {
    const mockBill = {
      id: 'ocd-bill/12345',
      identifier: 'HB 100',
      title: 'Education Act',
      session: '2025',
      jurisdiction: {
        id: 'ocd-jurisdiction/country:us/state:ny',
        name: 'New York',
        classification: 'state',
      },
      from_organization: {
        id: 'ocd-organization/1',
        name: 'Assembly',
        classification: 'lower',
      },
      classification: ['bill'],
      subject: ['Education'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      openstates_url: 'https://openstates.org/ny/bills/2025/HB100/',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBill,
    });
    vi.stubGlobal('fetch', mockFetch);

    const bill = await getBillByStateId('ny', '2025', 'HB 100', 'test-api-key');

    expect(bill).toEqual(mockBill);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const callUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(callUrl.origin + callUrl.pathname).toBe(
      'https://v3.openstates.org/bills/ny/2025/HB%20100',
    );
    expect(callUrl.searchParams.get('apikey')).toBe('test-api-key');
    expect(callUrl.searchParams.getAll('include')).toEqual(
      DEFAULT_BILL_INCLUDES,
    );
  });

  it('should normalize us-ny state parameter to ny when constructing API URL', async () => {
    const mockBill = {
      id: 'ocd-bill/12345',
      identifier: 'S9271',
      title: 'Broadband Act',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBill,
    });
    vi.stubGlobal('fetch', mockFetch);

    await getBillByStateId('us-ny', '2025-2026', 'S9271', 'test-api-key');

    const callUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(callUrl.origin + callUrl.pathname).toBe(
      'https://v3.openstates.org/bills/ny/2025-2026/S9271',
    );
  });

  it('should allow custom includes', async () => {
    const mockBill = {
      id: 'ocd-bill/67890',
      identifier: 'SB 200',
      title: 'Senate Bill 200',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBill,
    });
    vi.stubGlobal('fetch', mockFetch);

    const customIncludes = ['sponsorships', 'actions'];
    const bill = await getBillByStateId(
      'ny',
      '2025',
      'SB 200',
      'test-api-key',
      customIncludes,
    );

    expect(bill).toEqual(mockBill);
    const callUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(callUrl.searchParams.getAll('include')).toEqual(customIncludes);
  });

  it('should throw an error if any required parameter is missing or empty', async () => {
    await expect(getBillByStateId('', '2025', 'HB 100', 'key')).rejects.toThrow(
      'State/jurisdiction is required',
    );
    await expect(getBillByStateId('ny', '  ', 'HB 100', 'key')).rejects.toThrow(
      'Session is required',
    );
    await expect(getBillByStateId('ny', '2025', '', 'key')).rejects.toThrow(
      'Bill ID is required',
    );
    await expect(getBillByStateId('ny', '2025', 'HB 100', '')).rejects.toThrow(
      'API key is required',
    );
  });

  it('should throw an error if HTTP response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }),
    );

    await expect(
      getBillByStateId('ny', '2025', 'HB 999', 'test-api-key'),
    ).rejects.toThrow('OpenStates API error (404): Not Found');
  });

  it('should throw an error if response format is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpectedField: 'no id here' }),
      }),
    );

    await expect(
      getBillByStateId('ny', '2025', 'HB 100', 'test-api-key'),
    ).rejects.toThrow('Invalid OpenStates API response format');
  });
});
