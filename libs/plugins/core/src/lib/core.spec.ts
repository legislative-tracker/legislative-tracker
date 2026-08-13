import { chamberMapper } from './chamber-mapper';
import { mapPersonToLegislator } from './person-mapper';
import { Person } from '@jpstroud/opencivicdata-types';

describe('Plugin Core Utilities', () => {
  describe('chamberMapper', () => {
    it('should map state upper chamber to Senate and lower to Assembly', () => {
      expect(chamberMapper('state', 'upper')).toEqual('Senate');
      expect(chamberMapper('state', 'lower')).toEqual('Assembly');
    });

    it('should map country upper to Senate and lower to House', () => {
      expect(chamberMapper('country', 'upper')).toEqual('Senate');
      expect(chamberMapper('country', 'lower')).toEqual('House');
    });
  });

  describe('mapPersonToLegislator', () => {
    it('maps an OpenCivicData Person to a Partial<Legislator>', () => {
      const person: Person = {
        name: 'John Smith',
        party: 'Democrat',
        jurisdiction: {
          id: 'ocd-jurisdiction/country:us/state:ny/government',
          name: 'New York',
          classification: 'state',
        },
        current_role: {
          title: 'Senator',
          org_classification: 'upper',
          district: '12',
          division_id: '',
        },
      } as unknown as Person;

      const mapped = mapPersonToLegislator(person);
      expect(mapped.id).toEqual('John-Smith');
      expect(mapped.name).toEqual('John Smith');
      expect(mapped.honorific_prefix).toEqual('Senator');
      expect(mapped.chamber).toEqual('Senate');
      expect(mapped.district).toEqual('12');
      expect(mapped.party).toEqual('Democrat');
    });
  });
});
