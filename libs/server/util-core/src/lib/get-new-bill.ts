import { getBillByStateId } from '@legislative-tracker/server-data-access-openstates';
import {
  getAllPlugins,
  getPlugin,
  LegislativePlugin,
} from '@legislative-tracker/plugins-core';
import { OpenStatesBill } from '@legislative-tracker/shared/models';

export interface GetNewBillOptions {
  state: string;
  session?: string;
  billId: string;
  openstatesApiKey: string;
  stateApiKey?: string;
}

/**
 * Finds a registered LegislativePlugin matching the given state identifier or jurisdiction code.
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
 * Business logic function that sits between server triggers and OpenStates / state-specific APIs.
 *
 * @param options Configuration options including state, optional session, billId, and API keys.
 * @returns A raw OpenStatesBill record.
 */
export async function getNewBill(
  options: GetNewBillOptions,
): Promise<OpenStatesBill> {
  const { state, billId, openstatesApiKey } = options;

  if (!state || !state.trim()) {
    throw new Error('State/jurisdiction is required');
  }
  if (!billId || !billId.trim()) {
    throw new Error('Bill ID is required');
  }
  if (!openstatesApiKey || !openstatesApiKey.trim()) {
    throw new Error('OpenStates API key is required');
  }

  const cleanState = state.trim();
  const cleanBillId = billId.trim();
  const cleanOpenStatesApiKey = openstatesApiKey.trim();

  const plugin = findPluginForState(cleanState);

  let session = options.session?.trim();
  if (!session && plugin) {
    if (typeof plugin.calculateCurrentSession === 'function') {
      session = plugin.calculateCurrentSession();
    } else if (plugin.metadata?.jurisdiction?.currentSession) {
      session = plugin.metadata.jurisdiction.currentSession;
    }
  }

  if (!session) {
    throw new Error(
      `Session is required and could not be determined for state '${cleanState}'`,
    );
  }

  // Scaffold plugin connection: check plugin capability for direct state API fetch
  if (plugin && plugin.metadata?.capabilities?.hasApi) {
    try {
      // Future state-specific plugin API logic can be invoked here.
      // E.g., if (plugin.getBills) { ... }
    } catch {
      // Fall back to OpenStates API if state-specific plugin execution fails
    }
  }

  // Fetch bill details via OpenStates data access layer (calling getBillByStateId)
  return await getBillByStateId(
    cleanState,
    session,
    cleanBillId,
    cleanOpenStatesApiKey,
  );
}
