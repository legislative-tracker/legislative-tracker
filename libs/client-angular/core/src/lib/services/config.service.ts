import { Injectable, Signal } from '@angular/core';
import { RuntimeConfig } from '@legislative-tracker/shared/models';

@Injectable()
export abstract class ConfigService {
  abstract readonly config: Signal<RuntimeConfig>;
  abstract save(newConfig: Partial<RuntimeConfig>): Promise<void>;
  abstract load(): Promise<void>;
}
