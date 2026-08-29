import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { map, switchMap, take } from 'rxjs/operators';
import { from, of, Observable } from 'rxjs';
import { FIREBASE_AUTH } from '../firebase-tokens.token';

/**
 * Route guard restricting activation exclusively to authenticated users with admin claims.
 * Redirects unauthenticated users to `/login` and non-admin users to `/`.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject<Auth>(FIREBASE_AUTH, { optional: true });
  const router = inject(Router);

  if (!auth) {
    return of(router.createUrlTree(['/login']));
  }

  const authState$ = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(auth, (user) => subscriber.next(user));
  });

  return authState$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        return of(router.createUrlTree(['/login']));
      }

      return from(user.getIdTokenResult()).pipe(
        map((token) => {
          if (token.claims['admin'] === true) {
            return true;
          } else {
            return router.createUrlTree(['/']);
          }
        }),
      );
    }),
  );
};
