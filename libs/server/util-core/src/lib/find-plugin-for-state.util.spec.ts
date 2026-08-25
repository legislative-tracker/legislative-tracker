import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findPluginForState,
  getJurisdictionCode,
} from './find-plugin-for-state.util';
import * as pluginsCore from '@legislative-tracker/plugins-core';
import { LegislativePlugin } from '@legislative-tracker/plugins-core';

vi.mock('@legislative-tracker/plugins-core', () => ({
  getPlugin: vi.fn(),
  getAllPlugins: vi.fn(),
  registerPlugin: vi.fn().mockResolvedValue(undefined),
}));

describe('findPluginForState', () => {
  const mockPlugin: LegislativePlugin = {
    metadata: {
      id: 'leg-us-ny',
      name: 'New York Legislative Data Plugin',
      version: '1.0.0',
      description: 'NY State Plugin',
      jurisdiction: {
        id: 'ocd-jurisdiction/country:us/state:ny/government',
        name: 'New York',
        code: 'us-ny',
        classification: 'state',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pluginsCore.getAllPlugins).mockReturnValue([]);
  });

  it('should return undefined if state is empty or undefined', () => {
    expect(findPluginForState('')).toBeUndefined();
  });

  it('should return plugin directly via getPlugin if matched', () => {
    vi.mocked(pluginsCore.getPlugin).mockReturnValueOnce(mockPlugin);

    const result = findPluginForState('ny');
    expect(result).toEqual(mockPlugin);
    expect(pluginsCore.getPlugin).toHaveBeenCalledWith('ny');
  });

  it('should fallback to getAllPlugins matching by jurisdiction code, name, or id', () => {
    vi.mocked(pluginsCore.getPlugin).mockReturnValue(undefined);
    vi.mocked(pluginsCore.getAllPlugins).mockReturnValue([mockPlugin]);

    expect(findPluginForState('ny')).toEqual(mockPlugin);
    expect(findPluginForState('New York')).toEqual(mockPlugin);
    expect(findPluginForState('us-ny')).toEqual(mockPlugin);
    expect(findPluginForState('leg-us-ny')).toEqual(mockPlugin);
  });

  it('should find New Jersey plugin by various identifiers', () => {
    const mockNjPlugin: LegislativePlugin = {
      metadata: {
        id: 'leg-us-nj',
        name: 'New Jersey Legislature Plugin',
        version: '1.0.0',
        description: 'NJ State Plugin',
        jurisdiction: {
          id: 'ocd-jurisdiction/country:us/state:nj/government',
          name: 'New Jersey',
          code: 'us-nj',
        },
      },
      calculateCurrentSession: () => '2026-2027',
    };

    vi.mocked(pluginsCore.getPlugin).mockReturnValue(undefined);
    vi.mocked(pluginsCore.getAllPlugins).mockReturnValue([
      mockPlugin,
      mockNjPlugin,
    ]);

    expect(findPluginForState('nj')).toEqual(mockNjPlugin);
    expect(findPluginForState('New Jersey')).toEqual(mockNjPlugin);
    expect(findPluginForState('us-nj')).toEqual(mockNjPlugin);
    expect(findPluginForState('leg-us-nj')).toEqual(mockNjPlugin);
  });

  it('should return undefined if no matching plugin is registered', () => {
    vi.mocked(pluginsCore.getPlugin).mockReturnValue(undefined);
    vi.mocked(pluginsCore.getAllPlugins).mockReturnValue([mockPlugin]);

    expect(findPluginForState('ca')).toBeUndefined();
  });
});

describe('getJurisdictionCode', () => {
  const mockPlugin: LegislativePlugin = {
    metadata: {
      id: 'leg-us-ny',
      name: 'New York Legislative Data Plugin',
      version: '1.0.0',
      description: 'NY State Plugin',
      jurisdiction: {
        id: 'ocd-jurisdiction/country:us/state:ny/government',
        name: 'New York',
        code: 'us-ny',
        classification: 'state',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pluginsCore.getAllPlugins).mockReturnValue([mockPlugin]);
  });

  it('should return the plugin jurisdiction code if plugin exists', () => {
    expect(getJurisdictionCode('New York')).toBe('us-ny');
    expect(getJurisdictionCode('ny')).toBe('us-ny');
  });

  it('should return the plugin jurisdiction code for New Jersey if plugin exists', () => {
    const mockNjPlugin: LegislativePlugin = {
      metadata: {
        id: 'leg-us-nj',
        name: 'New Jersey Legislature Plugin',
        version: '1.0.0',
        description: 'NJ State Plugin',
        jurisdiction: {
          id: 'ocd-jurisdiction/country:us/state:nj/government',
          name: 'New Jersey',
          code: 'us-nj',
        },
      },
    };
    vi.mocked(pluginsCore.getAllPlugins).mockReturnValue([
      mockPlugin,
      mockNjPlugin,
    ]);
    expect(getJurisdictionCode('New Jersey')).toBe('us-nj');
    expect(getJurisdictionCode('nj')).toBe('us-nj');
  });

  it('should fallback to lowercased state string if no plugin exists', () => {
    vi.mocked(pluginsCore.getAllPlugins).mockReturnValue([]);
    expect(getJurisdictionCode('CA')).toBe('ca');
    expect(getJurisdictionCode('California')).toBe('california');
  });
});
