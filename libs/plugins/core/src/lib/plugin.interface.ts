import { Legislator, Legislation } from '@legislative-tracker/shared/models';

/**
 * Configuration options for state legislature API plugins
 */
export interface PluginConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  [key: string]: unknown;
}

/**
 * Interface definition for State Legislature Plugins
 */
export interface LegislaturePlugin {
  readonly id: string;
  readonly jurisdiction: string;
  readonly name: string;
  updateMembers(
    apiKey?: string,
    config?: PluginConfig,
  ): Promise<Partial<Legislator>[]>;
  updateBills(
    billList: string[],
    apiKey?: string,
    config?: PluginConfig,
  ): Promise<Legislation[]>;
}
