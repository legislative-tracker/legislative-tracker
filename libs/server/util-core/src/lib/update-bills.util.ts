import { getBillByOcdId } from '@legislative-tracker/server-data-access-openstates';
import { OpenStatesBill } from '@legislative-tracker/shared/models';
import { findPluginForState } from './find-plugin-for-state.util';

/**
 * Options for batch updating tracked bills in a state jurisdiction.
 */
export interface UpdateBillsOptions {
  /** Array of Open Civic Data bill identifiers to refresh. */
  ocdIds: string[];
  /** Optional state abbreviation or jurisdiction code. */
  state?: string;
  /** OpenStates API key. */
  openstatesApiKey: string;
  /** Optional state official API key. */
  stateApiKey?: string;
}

/**
 * Business logic function to update a collection of bills specified by OCD IDs.
 * Error handling is isolated per bill so that partial success results are returned.
 *
 * @param options - Configuration options including ocdIds, optional state, and API keys.
 * @returns Array of successfully updated OpenStatesBill records.
 */
export async function updateBills(
  options: UpdateBillsOptions,
): Promise<OpenStatesBill[]> {
  const { ocdIds, state, openstatesApiKey } = options;

  if (!openstatesApiKey || !openstatesApiKey.trim()) {
    throw new Error('OpenStates API key is required');
  }

  if (!Array.isArray(ocdIds)) {
    throw new Error('ocdIds must be an array');
  }

  const cleanOpenStatesApiKey = openstatesApiKey.trim();

  // If a state parameter is provided, resolve any state-specific plugin
  if (state && state.trim()) {
    const plugin = findPluginForState(state.trim());
    if (plugin && plugin.metadata?.capabilities?.hasApi) {
      try {
        // Reserved for future state plugin specific update capabilities
      } catch {
        // Fall back to standard OpenStates fetch
      }
    }
  }

  // Filter out empty or whitespace-only ocdIds
  const validOcdIds = ocdIds
    .map((id) => (typeof id === 'string' ? id.trim() : ''))
    .filter((id) => id.length > 0);

  if (validOcdIds.length === 0) {
    return [];
  }

  // Process all bill updates concurrently with isolated error handling
  const results = await Promise.allSettled(
    validOcdIds.map((ocdId) => getBillByOcdId(ocdId, cleanOpenStatesApiKey)),
  );

  const updatedBills: OpenStatesBill[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      updatedBills.push(result.value);
    }
  }

  return updatedBills;
}
