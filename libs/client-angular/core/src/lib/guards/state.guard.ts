import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LegislaturePluginRegistry } from '@legislative-tracker/plugins-core';

/**
 * Route guard validating whether a state code in the route parameter `stateCd`
 * matches a registered state legislative plugin.
 * Redirects unsupported states to `/404`.
 */
export const stateGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const stateParam = route.params['stateCd']?.toLowerCase();

  const isSupportedState =
    !!stateParam &&
    (LegislaturePluginRegistry.has(stateParam) ||
      LegislaturePluginRegistry.getAll().some(
        (p) =>
          p.metadata.id.toLowerCase() === stateParam ||
          p.metadata.jurisdiction?.code?.toLowerCase() === stateParam ||
          p.metadata.jurisdiction?.code?.toLowerCase() === `us-${stateParam}`,
      ));

  if (isSupportedState) {
    return true;
  } else {
    return router.createUrlTree(['/404']);
  }
};
