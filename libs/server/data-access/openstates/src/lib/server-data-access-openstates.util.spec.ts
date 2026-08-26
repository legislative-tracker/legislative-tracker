import { serverDataAccessOpenstates } from './server-data-access-openstates.util';

describe('serverDataAccessOpenstates', () => {
  it('should work', () => {
    expect(serverDataAccessOpenstates()).toEqual(
      'server-data-access-openstates',
    );
  });
});
