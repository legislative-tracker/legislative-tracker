import { Routes } from '@angular/router';

export const LEGISLATIVE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Dashboard | Legislative Tracker',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'bill/:id',
    title: 'Bill | Legislative Tracker',
    loadComponent: () => import('./bill-detail/bill-detail').then((m) => m.BillDetail),
  },
  {
    path: 'member/:id',
    title: 'Member | Legislative Tracker',
    loadComponent: () => import('./member-detail/member-detail').then((m) => m.MemberDetail),
  },
];
