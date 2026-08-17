import {
  LegislativePlugin,
  PluginMetadata,
} from '@legislative-tracker/plugins-core';

export class LegUsNyPlugin implements LegislativePlugin {
  readonly metadata: PluginMetadata;

  constructor() {
    const self = this;
    this.metadata = {
      id: 'leg-us-ny',
      name: 'New York State Legislature Plugin',
      version: '1.0.0',
      description:
        'Plugin for fetching and managing New York State legislative data.',
      jurisdiction: {
        id: 'ocd-jurisdiction/country:us/state:ny/government',
        code: 'us-ny',
        name: 'New York',
        isBicameral: true,
        chambers: {
          upper: 'Senate',
          lower: 'Assembly',
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
   * Calculates the 2-year biennium session identifier for New York State.
   * NY legislative sessions begin in odd-numbered years (e.g. 2025-2026).
   *
   * @param date Optional date to evaluate (defaults to current date)
   * @returns Session string in "YYYY-YYYY" format
   */
  calculateCurrentSession(date: Date = new Date()): string {
    const year = date.getFullYear();
    const startYear = year % 2 === 0 ? year - 1 : year;
    return `${startYear}-${startYear + 1}`;
  }
}

export const legUsNyPlugin = new LegUsNyPlugin();
