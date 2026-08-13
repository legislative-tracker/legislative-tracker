import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ImplementedStatesList } from '../app-config/implemented-states';

export const stateGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const implementedStates = ImplementedStatesList;

  // Get the 'stateCd' parameter from the current route snapshot
  const stateParam = route.params['stateCd']?.toLowerCase();

  if (implementedStates.includes(stateParam)) {
    return true; // Navigation allowed
  } else {
    // Redirect to home if the user tries to enter an unauthorized state
    return router.createUrlTree(['/404']);
  }
};
