import { nyLegislaturePlugin } from './plugin';

describe('nyLegislaturePlugin', () => {
  it('should have id ny', () => {
    expect(nyLegislaturePlugin.id).toEqual('ny');
  });
});
