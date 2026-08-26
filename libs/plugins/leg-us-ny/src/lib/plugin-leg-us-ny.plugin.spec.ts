import {
  registerPlugin,
  getPlugin,
  clearRegistry,
} from '@legislative-tracker/plugins-core';
import { LegUsNyPlugin, legUsNyPlugin } from './plugin-leg-us-ny.plugin';

describe('LegUsNyPlugin', () => {
  let plugin: LegUsNyPlugin;

  beforeEach(() => {
    clearRegistry();
    plugin = new LegUsNyPlugin();
  });

  describe('Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.metadata.id).toBe('leg-us-ny');
      expect(plugin.metadata.name).toBe('New York State Legislature Plugin');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.jurisdiction.id).toBe(
        'ocd-jurisdiction/country:us/state:ny/government',
      );
      expect(plugin.metadata.jurisdiction.code).toBe('us-ny');
      expect(plugin.metadata.jurisdiction.name).toBe('New York');
      expect(plugin.metadata.jurisdiction.isBicameral).toBe(true);
      expect(plugin.metadata.jurisdiction.chambers).toEqual({
        upper: 'Senate',
        lower: 'Assembly',
      });
      expect(plugin.metadata.capabilities.hasApi).toBe(true);
    });

    it('should dynamically return currentSession via jurisdiction metadata getter', () => {
      const expectedSession = plugin.calculateCurrentSession();
      expect(plugin.metadata.jurisdiction.currentSession).toBe(expectedSession);
    });
  });

  describe('calculateCurrentSession', () => {
    it('should return session "2025-2026" for an odd year date (e.g., May 10, 2025)', () => {
      const testDate = new Date(2025, 4, 10);
      expect(plugin.calculateCurrentSession(testDate)).toBe('2025-2026');
    });

    it('should return session "2025-2026" for an even year date (e.g., Nov 15, 2026)', () => {
      const testDate = new Date(2026, 10, 15);
      expect(plugin.calculateCurrentSession(testDate)).toBe('2025-2026');
    });

    it('should return session "2027-2028" for the following biennium odd year (e.g., Jan 1, 2027)', () => {
      const testDate = new Date(2027, 0, 1);
      expect(plugin.calculateCurrentSession(testDate)).toBe('2027-2028');
    });

    it('should use current date when no argument is passed', () => {
      const currentYear = new Date().getFullYear();
      const expectedStartYear =
        currentYear % 2 === 0 ? currentYear - 1 : currentYear;
      const expectedSession = `${expectedStartYear}-${expectedStartYear + 1}`;

      expect(plugin.calculateCurrentSession()).toBe(expectedSession);
    });
  });

  describe('Plugin Registry Integration', () => {
    it('should register successfully in PluginRegistry', async () => {
      await registerPlugin(legUsNyPlugin);

      const registered = getPlugin<LegUsNyPlugin>('leg-us-ny');
      expect(registered).toBeDefined();
      expect(registered?.metadata.id).toBe('leg-us-ny');
      expect(registered?.calculateCurrentSession(new Date(2025, 0, 1))).toBe(
        '2025-2026',
      );
    });
  });
});
