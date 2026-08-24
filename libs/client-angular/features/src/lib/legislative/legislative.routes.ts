import { Routes } from '@angular/router';

export const LEGISLATIVE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Dashboard | Legislative Tracker',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.Dashboard),
  },
  {
    path: 'legislation/:id',
    title: 'Legislation | Legislative Tracker',
    loadComponent: () =>
      import('./legislation-detail/legislation-detail.component').then(
        (m) => m.LegislationDetail,
      ),
  },
  {
    path: 'ocd-person/:id',
    title: 'Member | Legislative Tracker',
    loadComponent: () =>
      import('./member-detail/member-detail.component').then(
        (m) => m.MemberDetail,
      ),
  },
  {
    path: 'ocd-bill/:id',
    title: 'Bill | Legislative Tracker',
    loadComponent: () =>
      import('./bill-detail/bill-detail.component').then((m) => m.BillDetail),
  },
];
