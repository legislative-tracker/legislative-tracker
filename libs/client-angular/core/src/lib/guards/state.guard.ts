import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LegislaturePluginRegistry } from '@legislative-tracker/plugins-core';

export const stateGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Get the 'stateCd' parameter from the current route snapshot
  const stateParam = route.params['stateCd']?.toLowerCase();

  if (stateParam && LegislaturePluginRegistry.has(stateParam)) {
    return true; // Navigation allowed
  } else {
    // Redirect to home if the user tries to enter an unauthorized state
    return router.createUrlTree(['/404']);
  }
};
