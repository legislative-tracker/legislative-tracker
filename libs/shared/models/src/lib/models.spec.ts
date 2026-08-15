import { describe, it, expect } from 'vitest';
import { Address } from './address';

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
});
