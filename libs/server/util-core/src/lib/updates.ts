import {
  Legislator,
  Legislation,
  LegislatureUpdateFnMap,
} from '@legislative-tracker/shared/models';
import {
  updateBills as updateNyBills,
  updateMembers as updateNyMembers,
} from '@legislative-tracker/plugins-leg-us-ny';

/**
 * Mapping object that returns the specific "updater" function for a given jurisdiction
 */
export const updateFnMap: LegislatureUpdateFnMap<
  Partial<Legislation>[] | Partial<Legislator>[]
> = {
  ny: {
    bills: (bills: string[]) => updateNyBills(bills),
    members: () => updateNyMembers(),
  },
};

export const getBillUpdates = async (o: { id: string; bills: string[] }) => {
  const updateFn = updateFnMap[o.id]?.bills;
  if (!updateFn) {
    throw new Error(`No bill update function registered for state: ${o.id}`);
  }

  return {
    id: o.id,
    bills: (await updateFn(o.bills)) as Legislation[],
  };
};

/**
 * Fetches updated Legislator data for a given jurisdiction
 */
export const getMemberUpdates = async (
  legislatureCd: string,
): Promise<Partial<Legislator>[]> => {
  const updateFn = updateFnMap[legislatureCd]?.members;
  if (!updateFn) {
    throw new Error(
      `No member update function registered for state: ${legislatureCd}`,
    );
  }

  return (await updateFn()) as Partial<Legislator>[];
};
