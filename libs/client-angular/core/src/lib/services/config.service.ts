import { Injectable, Signal } from '@angular/core';
import { RuntimeConfig } from '@legislative-tracker/shared/models';

/**
 * Abstract configuration service managing application runtime branding,
 * theme settings, and organization metadata.
 */
@Injectable()
export abstract class ConfigService {
  /** Reactive signal holding the active client RuntimeConfig. */
  abstract readonly config: Signal<RuntimeConfig>;

  /**
   * Persists partial configuration overrides to remote storage and updates active signal.
   *
   * @param newConfig - Partial configuration object containing updated values.
   */
  abstract save(newConfig: Partial<RuntimeConfig>): Promise<void>;

  /**
   * Loads the current configuration from remote storage or fallback assets.
   */
  abstract load(): Promise<void>;
}
