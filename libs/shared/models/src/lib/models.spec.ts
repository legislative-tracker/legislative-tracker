import { describe, it, expect } from 'vitest';
import { Address } from './address';
import { getBillCols } from './column-config';

describe('Shared Models', () => {
  it('should construct a valid address object', () => {
    const address: Address = {
      street: '123 Main St',
      city: 'Albany',
      state: 'NY',
      zip: '12224',
    };
    expect(address.street).toBe('123 Main St');
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
