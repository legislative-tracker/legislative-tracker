import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Login | Legislative Tracker',
    loadComponent: () => import('./login/login.component').then((m) => m.Login),
  },
];
