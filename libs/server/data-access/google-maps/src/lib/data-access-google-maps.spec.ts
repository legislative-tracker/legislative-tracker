import { getGeocode } from './data-access-google-maps';

describe('getGeocode', () => {
  it('should be defined', () => {
    expect(getGeocode).toBeDefined();
  });
});
