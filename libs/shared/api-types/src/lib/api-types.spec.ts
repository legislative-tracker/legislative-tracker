import { describe, it, expect } from 'vitest';
import { GeocoderResponse } from './google-geocoder';

describe('Shared API Types', () => {
  it('should validate geocoder response structure', () => {
    const mockGeo: GeocoderResponse = {
      status: 'OK',
      results: [],
    };
    expect(mockGeo.status).toBe('OK');
    expect(mockGeo.results).toBeDefined();
  });
});
