import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // We use authState (an Observable) instead of the signal
  // to ensure we wait for the Firebase SDK to initialize
  // before kicking the user out.
  return authState(auth).pipe(
    take(1), // Take the first valid auth state (logged in or null)
    switchMap((user) => {
      if (!user) {
        // Not logged in at all? Send to login
        return of(router.createUrlTree(['/login']));
      }

      // Logged in? Check the custom claim
      return from(user.getIdTokenResult()).pipe(
        map((token) => {
          if (token.claims['admin'] === true) {
            return true; // Access granted
          } else {
            // Logged in but not an admin? Send to home
            return router.createUrlTree(['/']);
          }
        }),
      );
    }),
  );
};
