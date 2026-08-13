import { EnvironmentProviders, Provider } from '@angular/core';
import {
  LegislatureService,
  MockLegislatureService,
} from '@legislative-tracker/client-angular/data-access-legislature';

export const BACKEND_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  { provide: LegislatureService, useClass: MockLegislatureService },
];
