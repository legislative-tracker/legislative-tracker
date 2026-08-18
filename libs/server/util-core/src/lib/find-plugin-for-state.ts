import {
  getAllPlugins,
  getPlugin,
  LegislativePlugin,
} from '@legislative-tracker/plugins-core';

/**
 * Finds a registered LegislativePlugin matching the given state identifier or jurisdiction code.
 *
 * @param state State abbreviation, name, or jurisdiction code (e.g., 'ny', 'New York', 'us-ny').
 * @returns LegislativePlugin if found, undefined otherwise.
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
