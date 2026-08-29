import {
  getAllPlugins,
  getPlugin,
  LegislativePlugin,
  setEnabledPlugins,
} from '@legislative-tracker/plugins-core';
import '@legislative-tracker/plugins-leg-us-ny';
import '@legislative-tracker/plugins-leg-us-nj';

/**
 * Initializes the active plugins filter based on the ENABLED_PLUGINS environment variable.
 * Expects a comma-separated list of plugin IDs or jurisdiction codes (e.g., 'us-ny,leg-us-nj' or 'us-ny').
 *
 * @param envVar - Environment variable value (defaults to process.env['ENABLED_PLUGINS']).
 */
export function initEnabledPluginsFromEnv(
  envVar: string | undefined = typeof process !== 'undefined'
    ? process.env?.['ENABLED_PLUGINS']
    : undefined,
): void {
  if (!envVar) {
    return;
  }
  const parsed = envVar
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parsed.length > 0) {
    setEnabledPlugins(parsed);
  }
}

// Auto-initialize from process.env on module load
initEnabledPluginsFromEnv();

/**
 * Finds a registered LegislativePlugin matching the given state identifier or jurisdiction code.
 *
 * @param state - State abbreviation, name, or jurisdiction code (e.g., 'ny', 'New York', 'us-ny').
 * @returns LegislativePlugin if found, `undefined` otherwise.
 */
export function findPluginForState(
  state: string,
): LegislativePlugin | undefined {
  if (!state) return undefined;
  const cleanState = state.trim().toLowerCase();

  const directPlugin = getPlugin(cleanState);
  if (directPlugin) return directPlugin;

  const plugins = getAllPlugins();
  return plugins.find((plugin) => {
    const meta = plugin.metadata;
    if (!meta) return false;

    const id = meta.id?.toLowerCase();
    const code = meta.jurisdiction?.code?.toLowerCase();
    const jId = meta.jurisdiction?.id?.toLowerCase();
    const name = meta.jurisdiction?.name?.toLowerCase();

    return (
      id === cleanState ||
      code === cleanState ||
      code === `us-${cleanState}` ||
      name === cleanState ||
      jId === cleanState ||
      jId?.endsWith(`state:${cleanState}/government`)
    );
  });
}

/**
 * Resolves the canonical jurisdiction code for a given state input.
 * Defaults to the plugin's jurisdiction code (e.g., 'us-ny') if a matching plugin is found.
 * Falls back to the cleaned input state string if no plugin is registered.
 *
 * @param state - State abbreviation, name, or jurisdiction code (e.g., 'New York', 'ny', 'us-ny').
 * @returns Canonical jurisdiction code string (e.g., 'us-ny').
 */
export function getJurisdictionCode(state: string): string {
  if (!state || !state.trim()) return '';
  const cleanState = state.trim();
  const plugin = findPluginForState(cleanState);
  if (plugin?.metadata?.jurisdiction?.code) {
    return plugin.metadata.jurisdiction.code;
  }
  return cleanState.toLowerCase();
}
