import {
  LegislativePlugin,
  PluginMetadata,
  registerPlugin,
} from '@legislative-tracker/plugins-core';

/**
 * State legislative plugin for New Jersey (`us-nj`).
 * Implements session calculation and metadata for the NJ Senate and General Assembly.
 */
export class LegUsNjPlugin implements LegislativePlugin {
  /** Metadata and capabilities for the New Jersey plugin. */
  readonly metadata: PluginMetadata;

  constructor() {
    const self = this;
    this.metadata = {
      id: 'leg-us-nj',
      name: 'New Jersey Legislature Plugin',
      version: '1.0.0',
      description:
        'Plugin for fetching and managing New Jersey State legislative data.',
      jurisdiction: {
        id: 'ocd-jurisdiction/country:us/state:nj/government',
        code: 'us-nj',
        name: 'New Jersey',
        isBicameral: true,
        chambers: {
          upper: 'Senate',
          lower: 'General Assembly',
        },
        get currentSession(): string {
          return self.calculateCurrentSession();
        },
      },
      capabilities: {
        hasApi: true,
      },
    };
  }

  /**
   * Calculates the 2-year biennium session identifier for New Jersey State.
   * NJ legislative sessions begin in even-numbered years (e.g. 2024-2025, 2026-2027).
   *
   * @param date - Optional date to evaluate (defaults to current date).
   * @returns Session string in "YYYY-YYYY" format.
   */
  calculateCurrentSession(date: Date = new Date()): string {
    const year = date.getFullYear();
    const startYear = year % 2 === 0 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  }
}

/**
 * Global singleton instance of the New Jersey State legislative plugin.
 */
export const legUsNjPlugin = new LegUsNjPlugin();
registerPlugin(legUsNjPlugin).catch(() => {
  // Ignored if already registered
});
