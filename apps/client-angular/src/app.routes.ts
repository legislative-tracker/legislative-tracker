import { Routes } from '@angular/router';
import { NavComponent } from '@legislative-tracker/client-angular/ui';
import {
  stateGuard,
  adminGuard,
} from '@legislative-tracker/client-angular/core';

export const routes: Routes = [
  {
    path: '',
    component: NavComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'us-ny',
      },
      // --- Public Static Pages ---
      {
        path: '404',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features').then(
            (m) => m.NotFound,
          ),
        title: '404 | Legislative Tracker',
      },
      {
        path: 'about',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features').then(
            (m) => m.About,
          ),
        title: 'About | Legislative Tracker',
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features').then(
            (m) => m.Privacy,
          ),
        title: 'Privacy Policy | Legislative Tracker',
      },

      // --- Feature: Authentication ---
      {
        path: 'login',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features').then(
            (m) => m.Login,
          ),
        title: 'Login | Legislative Tracker',
      },

      // --- Feature: Admin ---
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('@legislative-tracker/client-angular/features').then(
            (m) => m.ADMIN_ROUTES,
          ),
      },

      // --- Feature: User Profile ---
      {
        path: 'profile',
        loadComponent: () =>
          import('@legislative-tracker/client-angular/features').then(
            (m) => m.Profile,
          ),
        title: 'Profile | Legislative Tracker',
      },

      // --- Feature: Legislative Tracker (State Wildcard) ---
      {
        path: ':stateCd',
        canActivate: [stateGuard],
        loadChildren: () =>
          import('@legislative-tracker/client-angular/features').then(
            (m) => m.LEGISLATIVE_ROUTES,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
