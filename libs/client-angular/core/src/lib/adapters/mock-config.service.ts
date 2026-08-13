import { Injectable, signal } from '@angular/core';
import { RuntimeConfig, DEFAULT_CONFIG } from '@legislative-tracker/shared/models';
import { ConfigService } from '../services/config.service';

@Injectable({ providedIn: 'root' })
export class MockConfigService implements ConfigService {
  readonly config = signal<RuntimeConfig>(DEFAULT_CONFIG);

  async save(newConfig: Partial<RuntimeConfig>): Promise<void> {
    this.config.update((current) => ({ ...current, ...newConfig }));
  }

  async load(): Promise<void> {
    return Promise.resolve();
  }
}
