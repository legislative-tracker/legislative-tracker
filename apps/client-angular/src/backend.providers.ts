import { EnvironmentProviders, Provider } from '@angular/core';
import {
  AuthService,
  ConfigService,
  FeedbackService,
  LegislatureService,
  UserManagementService,
  MockAuthService,
  MockConfigService,
  MockFeedbackService,
  MockLegislatureService,
  MockUserManagementService,
} from '@legislative-tracker/client-angular/core';

/**
 * Backend provider configuration mapping service abstractions to their active adapter implementations.
 */
export const BACKEND_PROVIDERS: (Provider | EnvironmentProviders)[] = [
  { provide: LegislatureService, useClass: MockLegislatureService },
  { provide: AuthService, useClass: MockAuthService },
  { provide: ConfigService, useClass: MockConfigService },
  { provide: FeedbackService, useClass: MockFeedbackService },
  { provide: UserManagementService, useClass: MockUserManagementService },
];
