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

  describe('LegislaturePluginRegistry', () => {
    const mockPlugin = {
      id: 'test-st',
      jurisdiction: 'US-ST',
      name: 'Test State Legislature',
      updateMembers: async () => [],
      updateBills: async () => [],
    };

    beforeEach(() => {
      import('./registry').then((m) => m.LegislaturePluginRegistry.clear());
    });

    it('should register and retrieve a plugin by ID case-insensitively', async () => {
      const { LegislaturePluginRegistry } = await import('./registry');
      LegislaturePluginRegistry.register(mockPlugin);

      expect(LegislaturePluginRegistry.has('test-st')).toBe(true);
      expect(LegislaturePluginRegistry.has('TEST-ST')).toBe(true);
      expect(LegislaturePluginRegistry.get('TEST-ST')).toBe(mockPlugin);
      expect(LegislaturePluginRegistry.getAll()).toContain(mockPlugin);
    });

    it('should unregister a plugin properly', async () => {
      const { LegislaturePluginRegistry } = await import('./registry');
      LegislaturePluginRegistry.register(mockPlugin);
      expect(LegislaturePluginRegistry.unregister('test-st')).toBe(true);
      expect(LegislaturePluginRegistry.has('test-st')).toBe(false);
    });
  });
});

