import { LegislativePlugin } from './types.model';

const registry = new Map<string, LegislativePlugin>();
let enabledFilter: Set<string> | null = null;

/**
 * Evaluates whether a plugin matches a single filter criterion.
 * Matches against plugin ID (e.g. 'leg-us-ny'), jurisdiction code ('us-ny'),
 * state abbreviation ('ny'), OCD jurisdiction ID, or jurisdiction name ('New York').
 *
 * @param plugin - The plugin instance.
 * @param filterPattern - Filter string pattern.
 * @returns `true` if matching, `false` otherwise.
 */
export function isPluginMatchingFilter(
  plugin: LegislativePlugin,
  filterPattern: string,
): boolean {
  if (!plugin?.metadata || !filterPattern) return false;
  const pattern = filterPattern.trim().toLowerCase();
  if (pattern === '*' || pattern === 'all') return true;

  const id = plugin.metadata.id?.toLowerCase();
  const code = plugin.metadata.jurisdiction?.code?.toLowerCase();
  const stateOnly = code?.replace(/^us-/, '');
  const jId = plugin.metadata.jurisdiction?.id?.toLowerCase();
  const name = plugin.metadata.jurisdiction?.name?.toLowerCase();

  return (
    id === pattern ||
    code === pattern ||
    code === `us-${pattern}` ||
    stateOnly === pattern ||
    name === pattern ||
    jId === pattern ||
    jId?.endsWith(`state:${pattern}/government`)
  );
}

/**
 * Configures the active enabled plugins filter in the registry.
 * If omitted, empty, or containing `*`, all registered plugins will be active.
 *
 * @param filter - Array of plugin IDs, jurisdiction codes, or state abbreviations to enable.
 */
export function setEnabledPlugins(filter?: string[] | null): void {
  if (!filter || !Array.isArray(filter) || filter.length === 0) {
    enabledFilter = null;
    return;
  }

  const cleaned = filter
    .map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
    .filter(Boolean);

  if (
    cleaned.length === 0 ||
    cleaned.includes('*') ||
    cleaned.includes('all')
  ) {
    enabledFilter = null;
  } else {
    enabledFilter = new Set(cleaned);
  }
}

/**
 * Retrieves the currently active plugin filter list, or `null` if all plugins are enabled.
 *
 * @returns Array of active filter strings or `null`.
 */
export function getEnabledPluginsFilter(): string[] | null {
  return enabledFilter ? Array.from(enabledFilter) : null;
}

/**
 * Checks whether a given plugin passes the active enabled filter.
 *
 * @param plugin - The plugin instance.
 * @returns `true` if enabled, `false` if filtered out.
 */
export function isPluginEnabled(plugin: LegislativePlugin): boolean {
  if (!enabledFilter) return true;
  for (const pattern of enabledFilter) {
    if (isPluginMatchingFilter(plugin, pattern)) {
      return true;
    }
  }
  return false;
}

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
 * Retrieves a registered and enabled plugin by its ID or jurisdiction alias.
 *
 * @typeParam T - Expected plugin type extending `LegislativePlugin`.
 * @param id - The unique plugin ID (e.g., 'leg-us-ny') or jurisdiction alias (e.g., 'us-ny', 'ny').
 * @returns The plugin instance, or `undefined` if not found or disabled.
 */
export function getPlugin<T = LegislativePlugin>(id: string): T | undefined {
  if (!id) return undefined;
  const direct = registry.get(id);
  if (direct && isPluginEnabled(direct)) {
    return direct as T;
  }

  // Alias lookup
  for (const p of registry.values()) {
    if (isPluginEnabled(p) && isPluginMatchingFilter(p, id)) {
      return p as T;
    }
  }

  return undefined;
}

/**
 * Checks whether a plugin with the given ID or jurisdiction alias is registered and enabled.
 *
 * @param id - The unique plugin ID or jurisdiction alias.
 * @param enabledOnly - If `true` (default), only returns `true` if the plugin is also enabled.
 * @returns `true` if registered (and enabled if `enabledOnly` is true), `false` otherwise.
 */
export function hasPlugin(id: string, enabledOnly = true): boolean {
  if (!id) return false;
  if (!enabledOnly) {
    if (registry.has(id)) return true;
    for (const p of registry.values()) {
      if (isPluginMatchingFilter(p, id)) return true;
    }
    return false;
  }
  return getPlugin(id) !== undefined;
}

/**
 * Checks whether a plugin with the given ID is present in the raw registry, regardless of active filter.
 *
 * @param id - The unique plugin ID.
 * @returns `true` if registered in the raw registry, `false` otherwise.
 */
export function hasRegisteredPlugin(id: string): boolean {
  return registry.has(id);
}

/**
 * Returns an array of all registered and currently enabled plugins.
 *
 * @returns Array containing all active legislative plugins.
 */
export function getAllPlugins(): LegislativePlugin[] {
  return Array.from(registry.values()).filter(isPluginEnabled);
}

/**
 * Returns an array of all registered plugins, ignoring any active enabled filter.
 *
 * @returns Array containing all registered legislative plugins.
 */
export function getAllRegisteredPlugins(): LegislativePlugin[] {
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
 * Clears all plugins and resets the filter in the registry.
 * Primarily used for resetting state during test fixtures.
 */
export function clearRegistry(): void {
  registry.clear();
  enabledFilter = null;
}

/**
 * Global singleton registry for discovering, registering, and retrieving state legislative plugins.
 */
export const LegislaturePluginRegistry = {
  /** Registers a new state legislature plugin. */
  register: registerPlugin,
  /** Retrieves a registered plugin by its ID or jurisdiction alias. */
  get: getPlugin,
  /** Checks if a plugin is registered and enabled. */
  has: hasPlugin,
  /** Checks if a plugin is registered in the raw registry regardless of filter. */
  hasRegistered: hasRegisteredPlugin,
  /** Returns all registered and currently enabled plugins. */
  getAll: getAllPlugins,
  /** Returns all registered plugins regardless of filter. */
  getAllRegistered: getAllRegisteredPlugins,
  /** Sets the active enabled plugins filter. */
  setEnabledPlugins: setEnabledPlugins,
  /** Gets the active enabled plugins filter. */
  getEnabledPluginsFilter: getEnabledPluginsFilter,
  /** Evaluates whether a plugin is currently enabled. */
  isPluginEnabled: isPluginEnabled,
  /** Checks if a plugin matches a filter string. */
  isPluginMatchingFilter: isPluginMatchingFilter,
  /** Unregisters a plugin by its ID. */
  unregister: unregisterPlugin,
  /** Clears all registered plugins and resets active filters. */
  clear: clearRegistry,
};
