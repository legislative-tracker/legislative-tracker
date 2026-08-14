import { Legislator, Legislation } from '@legislative-tracker/shared/models';
import { LegislaturePluginRegistry } from '@legislative-tracker/plugins-core';
import { nyLegislaturePlugin } from '@legislative-tracker/plugins-leg-us-ny';

// Register built-in plugins statically
LegislaturePluginRegistry.register(nyLegislaturePlugin);

/**
 * Legacy updateFnMap for backward compatibility, backed dynamically by LegislaturePluginRegistry.
 */
export const updateFnMap = new Proxy(
  {},
  {
    get(_target, prop: string) {
      const plugin = LegislaturePluginRegistry.get(prop);
      if (!plugin) return undefined;
      return {
        bills: (bills: string[]) => plugin.updateBills(bills),
        members: () => plugin.updateMembers(),
      };
    },
  },
);

/**
 * Fetches updated Legislation data for a given jurisdiction
 */
export const getBillUpdates = async (o: { id: string; bills: string[] }) => {
  const plugin = LegislaturePluginRegistry.get(o.id);
  if (!plugin) {
    throw new Error(`No bill update function registered for state: ${o.id}`);
  }

  const bills = await plugin.updateBills(o.bills);
  return {
    id: o.id,
    bills: bills as Legislation[],
  };
};

/**
 * Fetches updated Legislator data for a given jurisdiction
 */
export const getMemberUpdates = async (
  legislatureCd: string,
): Promise<Partial<Legislator>[]> => {
  const plugin = LegislaturePluginRegistry.get(legislatureCd);
  if (!plugin) {
    throw new Error(
      `No member update function registered for state: ${legislatureCd}`,
    );
  }

  return (await plugin.updateMembers()) as Partial<Legislator>[];
};
