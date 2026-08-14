import { slugify } from './string';
import { isImageLink, isEmail } from './validators';
import { getBillUpdates, getMemberUpdates } from './updates';
import { LegislaturePluginRegistry } from '@legislative-tracker/plugins-core';

describe('Server Util Core', () => {
  describe('slugify', () => {
    it('should slugify text correctly', () => {
      expect(slugify('Hello World!')).toEqual('hello-world');
      expect(slugify('José - Smith Jr.')).toEqual('jose-smith-jr');
    });
  });

  describe('validators', () => {
    it('isImageLink returns true for valid image links', () => {
      expect(isImageLink('https://nysenate.gov/img/member.jpg')).toBe(true);
      expect(isImageLink('http://nysenate.gov/headshots/member.png')).toBe(true);
      expect(isImageLink('https://example.com/photos/member-123')).toBe(true);
    });

    it('isImageLink returns false for placeholders and invalid links', () => {
      expect(isImageLink('https://nysenate.gov/img/no_image.png')).toBe(false);
      expect(isImageLink(undefined)).toBe(false);
    });

    it('isEmail validates email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('invalid')).toBe(false);
    });
  });

  describe('updates dispatcher', () => {
    it('throws error when requesting updates for an unregistered state', async () => {
      await expect(
        getBillUpdates({ id: 'invalid_state', bills: ['S100-2025'] }),
      ).rejects.toThrow('No bill update function registered for state: invalid_state');

      await expect(getMemberUpdates('invalid_state')).rejects.toThrow(
        'No member update function registered for state: invalid_state',
      );
    });

    it('successfully calls registered plugin for NY state', async () => {
      expect(LegislaturePluginRegistry.has('ny')).toBe(true);

      const nyPlugin = LegislaturePluginRegistry.get('ny');
      expect(nyPlugin).toBeDefined();
      expect(nyPlugin?.id).toBe('ny');
      expect(nyPlugin?.jurisdiction).toBe('US-NY');
    });
  });
});


