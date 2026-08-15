import { describe, it, expect } from 'vitest';
import { isSuccess, chamberMapper, isImageLink, isEmail } from './helpers';

describe('Shared Util Helpers', () => {
  it('should validate isSuccess correctly', () => {
    expect(isSuccess({ results: [] })).toBe(true);
    expect(isSuccess({ error: 'Failed' })).toBe(false);
  });

  it('should map chamber names correctly', () => {
    expect(chamberMapper('state', 'lower')).toBe('Assembly');
    expect(chamberMapper('country', 'upper')).toBe('Senate');
  });

  it('should validate image links correctly', () => {
    expect(isImageLink('https://example.com/photo.jpg')).toBe(true);
    expect(isImageLink('https://example.com/placeholder.png')).toBe(false);
  });

  it('should validate emails correctly', () => {
    expect(isEmail('test@example.com')).toBe(true);
    expect(isEmail('invalid-email')).toBe(false);
  });
});
