import { describe, it, expect } from 'vitest';
import { formatDocId } from './helpers';

describe('formatDocId', () => {
  it('should strip ocd-person/ prefix', () => {
    expect(formatDocId('ocd-person/dff234fa-8563-4028-982e-c0a221d99fd9')).toBe(
      'dff234fa-8563-4028-982e-c0a221d99fd9',
    );
  });

  it('should strip ocd-bill/ prefix', () => {
    expect(formatDocId('ocd-bill/12345678-abcd-ef01-2345-6789abcdef01')).toBe(
      '12345678-abcd-ef01-2345-6789abcdef01',
    );
  });

  it('should return unchanged ID if no prefix matches', () => {
    expect(formatDocId('dff234fa-8563-4028-982e-c0a221d99fd9')).toBe(
      'dff234fa-8563-4028-982e-c0a221d99fd9',
    );
  });
});
