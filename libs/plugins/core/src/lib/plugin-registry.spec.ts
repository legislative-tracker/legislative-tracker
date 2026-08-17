import {
  registerPlugin,
  getPlugin,
  hasPlugin,
  getAllPlugins,
  unregisterPlugin,
  clearRegistry,
} from './plugin-registry';
import { LegislativePlugin } from './types';

describe('Plugin Registry', () => {
  const mockPlugin: LegislativePlugin = {
    metadata: {
      id: 'leg-us-ny',
      name: 'Test NY Plugin',
      version: '1.0.0',
      description: 'Test plugin for NY jurisdiction',
      jurisdiction: {
        id: 'ocd-jurisdiction/country:us/state:ny/government',
        code: 'us-ny',
        name: 'New York',
        isBicameral: true,
        chambers: {
          upper: 'Senate',
          lower: 'Assembly',
        },
      },
      capabilities: {
        hasApi: true,
      },
    },
    getMembers: async () => [{ id: 'm1', name: 'Jane Doe' }],
    getBills: async () => [{ id: 'b1', title: 'Test Bill' }],
    syncJurisdiction: async () => ({
      success: true,
      recordsProcessed: 10,
      durationMs: 120,
    }),
  };

  beforeEach(() => {
    clearRegistry();
  });

  it('should register a valid plugin', async () => {
    await registerPlugin(mockPlugin);
    expect(hasPlugin('leg-us-ny')).toBe(true);
    expect(getPlugin('leg-us-ny')).toBe(mockPlugin);
  });

  it('should execute initialize hook on registration if provided', async () => {
    let initialized = false;
    const pluginWithInit: LegislativePlugin = {
      metadata: {
        id: 'leg-us-ca',
        name: 'Init Test',
        version: '1.0.0',
        jurisdiction: {
          id: 'ocd-jurisdiction/country:us/state:ca/government',
          code: 'us-ca',
          name: 'California',
          isBicameral: true,
          chambers: {
            upper: 'Senate',
            lower: 'Assembly',
          },
        },
        capabilities: {
          hasApi: false,
        },
      },
      initialize: async () => {
        initialized = true;
      },
    };

    await registerPlugin(pluginWithInit);
    expect(initialized).toBe(true);
    expect(hasPlugin('leg-us-ca')).toBe(true);
  });

  it('should throw error when registering duplicate plugin ID', async () => {
    await registerPlugin(mockPlugin);
    await expect(registerPlugin(mockPlugin)).rejects.toThrow(
      'Plugin with id "leg-us-ny" is already registered.',
    );
  });

  it('should throw error when plugin metadata or id is invalid', async () => {
    // @ts-expect-error Testing invalid plugin input
    await expect(registerPlugin(null)).rejects.toThrow(
      'Invalid plugin: plugin metadata and id are required.',
    );

    const invalidPlugin = { metadata: {} } as LegislativePlugin;
    await expect(registerPlugin(invalidPlugin)).rejects.toThrow(
      'Invalid plugin: plugin metadata and id are required.',
    );
  });

  it('should return all registered plugins', async () => {
    const secondPlugin: LegislativePlugin = {
      metadata: {
        id: 'leg-us-ca',
        name: 'Test CA Plugin',
        version: '1.0.0',
        jurisdiction: {
          id: 'ocd-jurisdiction/country:us/state:ca/government',
          code: 'us-ca',
          name: 'California',
          isBicameral: true,
          chambers: {
            upper: 'Senate',
            lower: 'Assembly',
          },
        },
        capabilities: {
          hasApi: true,
        },
      },
    };

    await registerPlugin(mockPlugin);
    await registerPlugin(secondPlugin);

    const all = getAllPlugins();
    expect(all).toHaveLength(2);
    expect(all).toContain(mockPlugin);
    expect(all).toContain(secondPlugin);
  });

  it('should unregister a plugin by ID', async () => {
    await registerPlugin(mockPlugin);
    expect(hasPlugin('leg-us-ny')).toBe(true);

    const result = unregisterPlugin('leg-us-ny');
    expect(result).toBe(true);
    expect(hasPlugin('leg-us-ny')).toBe(false);
    expect(getPlugin('leg-us-ny')).toBeUndefined();
  });

  it('should return false when unregistering non-existent plugin', () => {
    expect(unregisterPlugin('non-existent')).toBe(false);
  });

  it('should clear all plugins from registry', async () => {
    await registerPlugin(mockPlugin);
    expect(getAllPlugins()).toHaveLength(1);

    clearRegistry();
    expect(getAllPlugins()).toHaveLength(0);
  });

  it('should support executing optional plugin methods', async () => {
    await registerPlugin(mockPlugin);
    const plugin = getPlugin('leg-us-ny');

    expect(plugin?.getMembers).toBeDefined();
    expect(plugin?.getBills).toBeDefined();
    expect(plugin?.syncJurisdiction).toBeDefined();

    const members = await plugin?.getMembers?.();
    expect(members).toEqual([{ id: 'm1', name: 'Jane Doe' }]);

    const bills = await plugin?.getBills?.();
    expect(bills).toEqual([{ id: 'b1', title: 'Test Bill' }]);

    const syncRes = await plugin?.syncJurisdiction?.();
    expect(syncRes).toEqual({
      success: true,
      recordsProcessed: 10,
      durationMs: 120,
    });
  });
});
