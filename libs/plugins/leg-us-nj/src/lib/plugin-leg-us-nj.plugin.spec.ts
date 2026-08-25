import {
  registerPlugin,
  getPlugin,
  clearRegistry,
} from '@legislative-tracker/plugins-core';
import { LegUsNjPlugin, legUsNjPlugin } from './plugin-leg-us-nj.plugin';

describe('LegUsNjPlugin', () => {
  let plugin: LegUsNjPlugin;

  beforeEach(() => {
    clearRegistry();
    plugin = new LegUsNjPlugin();
  });

  describe('Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.metadata.id).toBe('leg-us-nj');
      expect(plugin.metadata.name).toBe('New Jersey Legislature Plugin');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.jurisdiction.id).toBe(
        'ocd-jurisdiction/country:us/state:nj/government',
      );
      expect(plugin.metadata.jurisdiction.code).toBe('us-nj');
      expect(plugin.metadata.jurisdiction.name).toBe('New Jersey');
      expect(plugin.metadata.jurisdiction.isBicameral).toBe(true);
      expect(plugin.metadata.jurisdiction.chambers).toEqual({
        upper: 'Senate',
        lower: 'General Assembly',
      });
      expect(plugin.metadata.capabilities.hasApi).toBe(true);
    });

    it('should dynamically return currentSession via jurisdiction metadata getter', () => {
      const expectedSession = plugin.calculateCurrentSession();
      expect(plugin.metadata.jurisdiction.currentSession).toBe(expectedSession);
    });
  });

  describe('calculateCurrentSession', () => {
    it('should return session "2024-2025" for an even year date (e.g., May 10, 2024)', () => {
      const testDate = new Date(2024, 4, 10);
      expect(plugin.calculateCurrentSession(testDate)).toBe('2024-2025');
    });

    it('should return session "2024-2025" for an odd year date (e.g., Nov 15, 2025)', () => {
      const testDate = new Date(2025, 10, 15);
      expect(plugin.calculateCurrentSession(testDate)).toBe('2024-2025');
    });

    it('should return session "2026-2027" for the following biennium even year (e.g., Jan 1, 2026)', () => {
      const testDate = new Date(2026, 0, 1);
      expect(plugin.calculateCurrentSession(testDate)).toBe('2026-2027');
    });

    it('should return session "2026-2027" for an odd year in that biennium (e.g., July 4, 2027)', () => {
      const testDate = new Date(2027, 6, 4);
      expect(plugin.calculateCurrentSession(testDate)).toBe('2026-2027');
    });

    it('should use current date when no argument is passed', () => {
      const currentYear = new Date().getFullYear();
      const expectedStartYear =
        currentYear % 2 === 0 ? currentYear : currentYear - 1;
      const expectedSession = `${expectedStartYear}-${expectedStartYear + 1}`;

      expect(plugin.calculateCurrentSession()).toBe(expectedSession);
    });
  });

  describe('Plugin Registry Integration', () => {
    it('should register successfully in PluginRegistry', async () => {
      await registerPlugin(legUsNjPlugin);

      const registered = getPlugin<LegUsNjPlugin>('leg-us-nj');
      expect(registered).toBeDefined();
      expect(registered?.metadata.id).toBe('leg-us-nj');
      expect(registered?.calculateCurrentSession(new Date(2026, 0, 1))).toBe(
        '2026-2027',
      );
    });
  });
});
