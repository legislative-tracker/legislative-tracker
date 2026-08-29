import { LegislativePlugin } from './types.model';

const registry = new Map<string, LegislativePlugin>();

/**
 * Registers a plugin into the central registry.
 * If the plugin defines an async `initialize()` method, it will be executed before registration completes.
 *
 * @param plugin - The plugin instance implementing `LegislativePlugin`.
 * @throws Error if plugin is invalid or already registered.
 */
export async function registerPlugin(plugin: LegislativePlugin): Promise<void> {
  if (!plugin || !plugin.metadata || !plugin.metadata.id) {
    throw new Error('Invalid plugin: plugin metadata and id are required.');
  }

  const id = plugin.metadata.id;
  if (registry.has(id)) {
    throw new Error(`Plugin with id "${id}" is already registered.`);
  }

  if (typeof plugin.initialize === 'function') {
    await plugin.initialize();
  }

  registry.set(id, plugin);
}

/**
 * Retrieves a registered plugin by its ID.
 *
 * @typeParam T - Expected plugin type extending `LegislativePlugin`.
 * @param id - The unique plugin ID (e.g., 'leg-us-ny').
 * @returns The plugin instance, or `undefined` if not found.
 */
export function getPlugin<T = LegislativePlugin>(id: string): T | undefined {
  return registry.get(id) as T | undefined;
}

/**
 * Checks whether a plugin with the given ID is registered.
 *
 * @param id - The unique plugin ID.
 * @returns `true` if registered, `false` otherwise.
 */
export function hasPlugin(id: string): boolean {
  return registry.has(id);
}

/**
 * Returns an array of all registered plugins in the workspace.
 *
 * @returns Array containing all active legislative plugins.
 */
export function getAllPlugins(): LegislativePlugin[] {
  return Array.from(registry.values());
}

/**
 * Unregisters a plugin by its ID.
 *
 * @param id - The unique plugin ID.
 * @returns `true` if a plugin was removed, `false` if it was not found.
 */
export function unregisterPlugin(id: string): boolean {
  return registry.delete(id);
}

/**
 * Clears all plugins from the registry.
 * Primarily used for resetting state during test fixtures.
 */
export function clearRegistry(): void {
  registry.clear();
}

/**
 * Global singleton registry for discovering, registering, and retrieving state legislative plugins.
 */
export const LegislaturePluginRegistry = {
  /** Registers a new state legislature plugin. */
  register: registerPlugin,
  /** Retrieves a registered plugin by its ID. */
  get: getPlugin,
  /** Checks if a plugin is registered. */
  has: hasPlugin,
  /** Returns all registered plugins. */
  getAll: getAllPlugins,
  /** Unregisters a plugin by its ID. */
  unregister: unregisterPlugin,
  /** Clears all registered plugins. */
  clear: clearRegistry,
};
