import { triggersFirebase } from './triggers-firebase.util';

describe('triggersFirebase', () => {
  it('should work', () => {
    expect(triggersFirebase()).toEqual('triggers-firebase');
  });
});
