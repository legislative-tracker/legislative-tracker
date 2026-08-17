export interface ChamberInfo {
  /**
   * Name of the upper chamber (e.g., 'Senate'). Omitted for unicameral legislatures.
   */
  upper?: string;

  /**
   * Name of the lower chamber (e.g., 'Assembly', 'House of Representatives').
   */
  lower?: string;
}

export interface JurisdictionMetadata {
  /**
   * Full OCD Jurisdiction string (e.g., 'ocd-jurisdiction/country:us/state:ny/government').
   */
  id: string;

  /**
   * Short jurisdiction code (e.g., 'us-ny').
   */
  code: string;

  /**
   * Human-readable jurisdiction name (e.g., 'New York').
   */
  name: string;

  /**
   * Whether the legislature has two chambers (Senate + House/Assembly).
   */
  isBicameral: boolean;

  /**
   * Legislative chamber names.
   */
  chambers: ChamberInfo;
}

export interface PluginCapabilities {
  /**
   * Indicates whether real-time or direct API fetching is supported by the plugin.
   */
  hasApi: boolean;

  /**
   * Optional custom capability flags.
   */
  [key: string]: unknown;
}

export interface PluginMetadata {
  /**
   * Unique identifier for the plugin (e.g., 'leg-us-ny').
   */
  id: string;

  /**
   * Human-readable name of the plugin (e.g., 'New York State Legislature Plugin').
   */
  name: string;

  /**
   * Semantic version string of the plugin (e.g., '1.0.0').
   */
  version: string;

  /**
   * Target jurisdiction metadata details.
   */
  jurisdiction: JurisdictionMetadata;

  /**
   * Plugin technical capabilities.
   */
  capabilities: PluginCapabilities;

  /**
   * Optional description of the plugin functionality.
   */
  description?: string;
}

export interface GetMembersOptions {
  session?: string;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

export interface GetBillsOptions {
  session?: string;
  query?: string;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

export interface SyncOptions {
  session?: string;
  force?: boolean;
  fullSync?: boolean;
  [key: string]: unknown;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  durationMs: number;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

export interface LegislativePlugin<TMember = unknown, TBill = unknown> {
  readonly metadata: PluginMetadata;

  /**
   * Optional asynchronous initialization hook executed when the plugin is registered.
   */
  initialize?(): Promise<void>;

  /**
   * Optional method to retrieve legislative members.
   */
  getMembers?(options?: GetMembersOptions): Promise<TMember[]>;

  /**
   * Optional method to retrieve legislative bills.
   */
  getBills?(options?: GetBillsOptions): Promise<TBill[]>;

  /**
   * Optional method to synchronize jurisdiction data.
   */
  syncJurisdiction?(options?: SyncOptions): Promise<SyncResult>;
}
