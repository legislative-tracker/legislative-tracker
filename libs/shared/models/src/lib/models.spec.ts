import { describe, it, expect } from 'vitest';
import { SearchAddress } from './address.model';
import { getBillCols } from './column-config.model';

describe('Shared Models', () => {
  it('should construct a valid address object', () => {
    const address: SearchAddress = {
      address: '123 Main St',
      address2: null,
      city: 'Albany',
      state: 'NY',
      postalCode: 12224,
    };
    expect(address.address).toBe('123 Main St');
    expect(address.state).toBe('NY');
  });

  describe('getBillCols', () => {
    it('should return default labels when no chamber info or state is provided', () => {
      const cols = getBillCols();
      expect(cols).toEqual([
        { key: 'name', label: 'Title' },
        { key: 'upperBillId', label: 'Upper Chamber Bill ID' },
        { key: 'lowerBillId', label: 'Lower Chamber Bill ID' },
      ]);
    });

    it('should use custom chamber names when ChamberInfo is passed', () => {
      const cols = getBillCols({ upper: 'Senate', lower: 'Assembly' });
      expect(cols).toEqual([
        { key: 'name', label: 'Title' },
        { key: 'upperBillId', label: 'Senate Bill ID' },
        { key: 'lowerBillId', label: 'Assembly Bill ID' },
      ]);
    });
  });
});
