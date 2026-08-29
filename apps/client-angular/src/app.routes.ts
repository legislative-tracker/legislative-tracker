import { Routes } from '@angular/router';
import { NavComponent } from '@legislative-tracker/client-angular/ui';
import {
  stateGuard,
  adminGuard,
} from '@legislative-tracker/client-angular/core';

/**
 * Top-level application routing table defining public static pages, auth, admin, and state-specific feature branches.
 */
export const routes: Routes = [
  {
    path: '',
    component: NavComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features/pages/states-directory/states-directory.component').then(
            (m) => m.StatesDirectory,
          ),
        title: 'State Directory | Legislative Tracker',
      },
      // --- Public Static Pages ---
      {
        path: '404',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features/pages/not-found/not-found.component').then(
            (m) => m.NotFound,
          ),
        title: '404 | Legislative Tracker',
      },
      {
        path: 'about',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features/pages/about/about.component').then(
            (m) => m.About,
          ),
        title: 'About | Legislative Tracker',
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features/pages/privacy/privacy.component').then(
            (m) => m.Privacy,
          ),
        title: 'Privacy Policy | Legislative Tracker',
      },
      {
        path: 'terms',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features/pages/terms/terms.component').then(
            (m) => m.Terms,
          ),
        title: 'Terms of Service | Legislative Tracker',
      },
      {
        path: 'saved-bills',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features/legislative/saved-bills/saved-bills.component').then(
            (m) => m.SavedBills,
          ),
        title: 'Offline Saved Bills | Legislative Tracker',
      },

      // --- Feature: Authentication ---
      {
        path: 'login',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features/auth/login/login.component').then(
            (m) => m.Login,
          ),
        title: 'Login | Legislative Tracker',
      },

      // --- Feature: Admin ---
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('@legislative-tracker/client-angular/features/admin/admin.routes').then(
            (m) => m.ADMIN_ROUTES,
          ),
      },

      // --- Feature: User Profile ---
      {
        path: 'profile',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features/user/profile/profile.component').then(
            (m) => m.Profile,
          ),
        title: 'Profile | Legislative Tracker',
      },

      // --- Feature: Legislative Tracker (State Wildcard) ---
      {
        path: ':stateCd',
        canActivate: [stateGuard],
        loadChildren: () =>
          import('@legislative-tracker/client-angular/features/legislative/legislative.routes').then(
            (m) => m.LEGISLATIVE_ROUTES,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
