import { Legislator, Legislation } from '@legislative-tracker/shared/models';

/**
 * Interface definition for State Legislature Plugins
 */
export interface LegislaturePlugin {
  id: string;
  name: string;
  updateMembers(apiKey?: string): Promise<Partial<Legislator>[]>;
  updateBills(billList: string[], apiKey?: string): Promise<Legislation[]>;
}
