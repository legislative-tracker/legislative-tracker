import { slugify } from './string';

describe('slugify', () => {
  it('should slugify text', () => {
    expect(slugify('Hello World!')).toEqual('hello-world');
  });
});
