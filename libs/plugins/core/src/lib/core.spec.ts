import { chamberMapper } from './chamber-mapper';

describe('chamberMapper', () => {
  it('should map state upper chamber to Senate', () => {
    expect(chamberMapper('state', 'upper')).toEqual('Senate');
  });
});
