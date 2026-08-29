import { Routes } from '@angular/router';

/**
 * Child routes for administrative features: configuration management, user administration, and bill mutations.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Admin | Legislative Tracker',
    loadComponent: () => import('./admin/admin.component').then((m) => m.Admin),
  },
  // User Management
  {
    path: 'addAdmin',
    title: 'Promote User to Admin | Legislative Tracker',
    loadComponent: () =>
      import('./user-mgmt/add-admin/add-admin.component').then(
        (m) => m.AddAdmin,
      ),
  },
  {
    path: 'removeAdmin',
    title: 'Demote Admin | Legislative Tracker',
    loadComponent: () =>
      import('./user-mgmt/remove-admin/remove-admin.component').then(
        (m) => m.RemoveAdmin,
      ),
  },
  // Bill Management
  {
    path: 'manualUpdate',
    title: 'Manual Data Sync | Legislative Tracker',
    loadComponent: () =>
      import('./bill-mgmt/manual-update/manual-update.component').then(
        (m) => m.ManualUpdate,
      ),
  },
  {
    path: 'addBill',
    title: 'Add Bill | Legislative Tracker',
    loadComponent: () =>
      import('./bill-mgmt/add-bill/add-bill.component').then((m) => m.AddBill),
  },
  {
    path: 'editBill',
    title: 'Edit Bill | Legislative Tracker',
    loadComponent: () =>
      import('./bill-mgmt/edit-bill/edit-bill.component').then(
        (m) => m.EditBill,
      ),
  },
  {
    path: 'removeBill',
    title: 'Remove Bill | Legislative Tracker',
    loadComponent: () =>
      import('./bill-mgmt/remove-bill/remove-bill.component').then(
        (m) => m.RemoveBill,
      ),
  },
];
