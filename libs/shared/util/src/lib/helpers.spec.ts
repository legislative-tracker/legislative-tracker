import {
  isSuccess,
  chamberMapper,
  mapPersonToLegislator,
  isImageLink,
  isEmail,
} from './helpers';
import { Person } from '@jpstroud/opencivicdata-types';

describe('Shared Utilities', () => {
  describe('isSuccess', () => {
    it('returns true when results property is defined', () => {
      expect(isSuccess({ results: [1, 2, 3] })).toBe(true);
    });

    it('returns false when results property is absent or null', () => {
      expect(isSuccess({})).toBe(false);
      expect(isSuccess(null)).toBe(false);
      expect(isSuccess(undefined)).toBe(false);
    });
  });

  describe('chamberMapper', () => {
    it('maps country jurisdiction upper to Senate and lower to House', () => {
      expect(chamberMapper('country', 'upper')).toBe('Senate');
      expect(chamberMapper('country', 'lower')).toBe('House');
    });

    it('maps state jurisdiction upper to Senate and lower to Assembly', () => {
      expect(chamberMapper('state', 'upper')).toBe('Senate');
      expect(chamberMapper('state', 'lower')).toBe('Assembly');
    });

    it('returns fallback chamber if jurisdiction or chamber is unknown', () => {
      expect(chamberMapper('unknown', 'custom')).toBe('custom');
    });
  });

  describe('mapPersonToLegislator', () => {
    it('maps OCD Person object to Partial<Legislator>', () => {
      const mockPerson: Person = {
        name: 'Jane M. Doe',
        party: 'Democrat',
        jurisdiction: {
          id: 'ocd-jurisdiction/country:us/state:ny/government',
          name: 'New York',
          classification: 'state',
        },
        current_role: {
          title: 'Senator',
          org_classification: 'upper',
          district: '26',
          division_id: '',
        },
      } as unknown as Person;

      const result = mapPersonToLegislator(mockPerson);

      expect(result.id).toBe('Jane-M-Doe');
      expect(result.name).toBe('Jane M. Doe');
      expect(result.honorific_prefix).toBe('Senator');
      expect(result.chamber).toBe('Senate');
      expect(result.district).toBe('26');
      expect(result.party).toBe('Democrat');
    });
  });

  describe('isImageLink', () => {
    it('returns true for valid image HTTP/HTTPS URLs', () => {
      expect(isImageLink('https://example.com/photo.jpg')).toBe(true);
      expect(isImageLink('https://example.com/headshots/member.png?v=2')).toBe(
        true,
      );
      expect(isImageLink('https://example.com/avatars/123')).toBe(true);
    });

    it('returns false for placeholder or invalid image URLs', () => {
      expect(isImageLink('https://example.com/no_image.jpg')).toBe(false);
      expect(isImageLink('https://example.com/default-photo.png')).toBe(false);
      expect(isImageLink('invalid-url')).toBe(false);
      expect(isImageLink(undefined)).toBe(false);
    });
  });

  describe('isEmail', () => {
    it('validates standard email addresses', () => {
      expect(isEmail('senator@senate.ny.gov')).toBe(true);
      expect(isEmail('  user@domain.com  ')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isEmail('invalid-email')).toBe(false);
      expect(isEmail('user@')).toBe(false);
      expect(isEmail(undefined)).toBe(false);
    });
  });
});
