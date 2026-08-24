import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBillByOcdId } from './get-bill-by-ocd-id.util';
import { DEFAULT_BILL_INCLUDES } from './constants.config';

describe('getBillByOcdId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should fetch a single bill by ID with default includes', async () => {
    const mockBill = {
      id: 'ocd-bill/12345',
      identifier: 'HB 100',
      title: 'An act relating to education',
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
      sponsorships: [
        {
          name: 'Jane Doe',
          entity_type: 'person',
          primary: true,
          classification: 'sponsor',
        },
      ],
      actions: [
        {
          id: 'act/1',
          description: 'Introduced',
          date: '2025-01-01',
          order: 1,
          classification: ['introduction'],
          organization: {
            id: 'ocd-organization/1',
            name: 'Assembly',
            classification: 'lower',
          },
          related_entities: [],
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBill,
    });
    vi.stubGlobal('fetch', mockFetch);

    const bill = await getBillByOcdId('ocd-bill/12345', 'test-api-key');

    expect(bill).toEqual(mockBill);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const callUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(callUrl.origin + callUrl.pathname).toBe(
      'https://v3.openstates.org/bills/ocd-bill/12345',
    );
    expect(callUrl.searchParams.get('apikey')).toBe('test-api-key');
    expect(callUrl.searchParams.getAll('include')).toEqual(
      DEFAULT_BILL_INCLUDES,
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
    const bill = await getBillByOcdId(
      'ocd-bill/67890',
      'test-api-key',
      customIncludes,
    );

    expect(bill).toEqual(mockBill);
    const callUrl = new URL(mockFetch.mock.calls[0][0]);
    expect(callUrl.searchParams.getAll('include')).toEqual(customIncludes);
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
      getBillByOcdId('ocd-bill/non-existent', 'test-api-key'),
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
      getBillByOcdId('ocd-bill/invalid-format', 'test-api-key'),
    ).rejects.toThrow('Invalid OpenStates API response format');
  });
});
