/**
 * Chamber naming configuration for a legislative jurisdiction.
 */
export interface ChamberInfo {
  /**
   * Name of the upper chamber (e.g., 'Senate'). Omitted for unicameral legislatures.
   */
  upper?: string;

  /**
   * Name of the lower chamber (e.g., 'Assembly', 'House of Representatives', 'General Assembly').
   */
  lower?: string;
}

/**
 * Metadata defining a state or territorial legislative jurisdiction.
 */
export interface JurisdictionMetadata {
  /**
   * Full Open Civic Data jurisdiction identifier (e.g., 'ocd-jurisdiction/country:us/state:ny/government').
   */
  id: string;

  /**
   * Canonical short jurisdiction code (e.g., 'us-ny', 'us-nj').
   */
  code: string;

  /**
   * Human-readable jurisdiction name (e.g., 'New York', 'New Jersey').
   */
  name: string;

  /**
   * Whether the legislature has two chambers (Senate + House/Assembly).
   */
  isBicameral: boolean;

  /**
   * Legislative chamber display names.
   */
  chambers: ChamberInfo;

  /**
   * Current legislative session identifier (e.g. '2025-2026').
   */
  readonly currentSession: string;
}

/**
 * Feature flags and capabilities advertised by a state legislature plugin.
 */
export interface PluginCapabilities {
  /**
   * Indicates whether real-time or direct official API fetching is supported by the plugin.
   */
  hasApi: boolean;

  /**
   * Optional custom capability flags.
   */
  [key: string]: unknown;
}

/**
 * Metadata describing a registered state legislative plugin.
 */
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

/**
 * Options passed to a plugin's member retrieval method.
 */
export interface GetMembersOptions {
  /** Target legislative session filter. */
  session?: string;
  /** Page number for paginated member queries. */
  page?: number;
  /** Number of member records per page. */
  perPage?: number;
  /** Arbitrary state-specific query parameters. */
  [key: string]: unknown;
}

/**
 * Options passed to a plugin's bill retrieval method.
 */
export interface GetBillsOptions {
  /** Target legislative session filter. */
  session?: string;
  /** Search query text or bill number prefix. */
  query?: string;
  /** Page number for paginated bill queries. */
  page?: number;
  /** Number of bill records per page. */
  perPage?: number;
  /** Arbitrary state-specific query parameters. */
  [key: string]: unknown;
}

/**
 * Options passed to a plugin's jurisdiction sync method.
 */
export interface SyncOptions {
  /** Target legislative session to synchronize. */
  session?: string;
  /** Force full synchronization bypassing incremental caches. */
  force?: boolean;
  /** Indicates whether a comprehensive multi-year sync should run. */
  fullSync?: boolean;
  /** Arbitrary sync parameters. */
  [key: string]: unknown;
}

/**
 * Summary result returned following jurisdiction synchronization.
 */
export interface SyncResult {
  /** Whether the sync operation succeeded without fatal errors. */
  success: boolean;
  /** Number of database records created or updated. */
  recordsProcessed: number;
  /** Execution duration in milliseconds. */
  durationMs: number;
  /** Array of non-fatal warning or error messages encountered during execution. */
  errors?: string[];
  /** Arbitrary sync metadata. */
  metadata?: Record<string, unknown>;
}

/**
 * Standard contract that every jurisdiction state plugin must implement.
 *
 * @typeParam TMember - Type representing legislator/member records produced by the plugin.
 * @typeParam TBill - Type representing bill records produced by the plugin.
 */
export interface LegislativePlugin<TMember = unknown, TBill = unknown> {
  /**
   * Immutable plugin metadata and capabilities.
   */
  readonly metadata: PluginMetadata;

  /**
   * Calculates the current legislative session identifier for a given date (or current date if omitted).
   *
   * @param date - Optional date to evaluate (defaults to current date).
   * @returns Canonical session string (e.g., '2025-2026').
   */
  calculateCurrentSession(date?: Date): string;

  /**
   * Optional asynchronous initialization hook executed when the plugin is registered.
   */
  initialize?(): Promise<void>;

  /**
   * Optional method to retrieve legislative members.
   *
   * @param options - Pagination and filter parameters.
   * @returns Array of member records.
   */
  getMembers?(options?: GetMembersOptions): Promise<TMember[]>;

  /**
   * Optional method to retrieve legislative bills.
   *
   * @param options - Pagination and filter parameters.
   * @returns Array of bill records.
   */
  getBills?(options?: GetBillsOptions): Promise<TBill[]>;

  /**
   * Optional method to synchronize jurisdiction data.
   *
   * @param options - Synchronization flags and session options.
   * @returns Summary of synchronization result.
   */
  syncJurisdiction?(options?: SyncOptions): Promise<SyncResult>;
}
