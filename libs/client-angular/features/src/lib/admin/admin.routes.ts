import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Admin | Legislative Tracker',
    loadComponent: () => import('./admin/admin').then((m) => m.Admin),
  },
  // User Management
  {
    path: 'addAdmin',
    title: 'Promote User to Admin | Legislative Tracker',
    loadComponent: () => import('./user-mgmt/add-admin/add-admin').then((m) => m.AddAdmin),
  },
  {
    path: 'removeAdmin',
    title: 'Demote Admin | Legislative Tracker',
    loadComponent: () => import('./user-mgmt/remove-admin/remove-admin').then((m) => m.RemoveAdmin),
  },
  // Bill Management
  {
    path: 'addBill',
    title: 'Add Bill | Legislative Tracker',
    loadComponent: () => import('./bill-mgmt/add-bill/add-bill').then((m) => m.AddBill),
  },
  {
    path: 'removeBill',
    title: 'Remove Bill | Legislative Tracker',
    loadComponent: () => import('./bill-mgmt/remove-bill/remove-bill').then((m) => m.RemoveBill),
  },
];
