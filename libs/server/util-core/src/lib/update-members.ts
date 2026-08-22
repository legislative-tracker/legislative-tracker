import { getMembers } from '@legislative-tracker/server-data-access-openstates';
import { OpenStatesPerson } from '@legislative-tracker/shared/models';
import { findPluginForState } from './find-plugin-for-state';

export interface UpdateMembersOptions {
  state: string;
  openstatesApiKey: string;
  stateApiKey?: string;
}

/**
 * Business logic function to retrieve legislative members for a given state.
 * Connects to OpenStates API and state-specific plugins when available.
 *
 * @param options Configuration options including state and API key.
 * @returns Array of OpenStatesPerson records.
 */
export async function updateMembers(
  options: UpdateMembersOptions,
): Promise<OpenStatesPerson[]> {
  const { state, openstatesApiKey } = options;

  if (!state || !state.trim()) {
    throw new Error('State is required');
  }

  if (!openstatesApiKey || !openstatesApiKey.trim()) {
    throw new Error('OpenStates API key is required');
  }

  const cleanState = state.trim();
  const cleanOpenStatesApiKey = openstatesApiKey.trim();

  // Check for state-specific plugin integration
  const plugin = findPluginForState(cleanState);
  if (plugin && plugin.metadata?.capabilities?.hasApi) {
    try {
      // Reserved for future state plugin member retrieval hooks
    } catch {
      // Fall back to standard OpenStates fetch
    }
  }

  try {
    return await getMembers(cleanState, cleanOpenStatesApiKey);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to update members for state '${cleanState}': ${detail}`,
    );
  }
}
