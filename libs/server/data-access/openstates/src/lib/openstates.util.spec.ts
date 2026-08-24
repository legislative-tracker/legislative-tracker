import { describe, it, expect } from 'vitest';
import { normalizeJurisdictionForOpenStates } from './openstates.util';

describe('normalizeJurisdictionForOpenStates', () => {
  it('should normalize us-xx to xx lowercased', () => {
    expect(normalizeJurisdictionForOpenStates('us-ny')).toBe('ny');
    expect(normalizeJurisdictionForOpenStates('US-NY')).toBe('ny');
    expect(normalizeJurisdictionForOpenStates('us-ca')).toBe('ca');
  });

  it('should normalize leg-us-xx to xx lowercased', () => {
    expect(normalizeJurisdictionForOpenStates('leg-us-ny')).toBe('ny');
  });

  it('should normalize 2-letter state codes to lowercase', () => {
    expect(normalizeJurisdictionForOpenStates('NY')).toBe('ny');
    expect(normalizeJurisdictionForOpenStates('ny')).toBe('ny');
  });

  it('should preserve full state names', () => {
    expect(normalizeJurisdictionForOpenStates('New York')).toBe('New York');
  });

  it('should return empty string for empty input', () => {
    expect(normalizeJurisdictionForOpenStates('')).toBe('');
    expect(normalizeJurisdictionForOpenStates('   ')).toBe('');
  });
});
