import { Routes, ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { map, of } from 'rxjs';
import { LegislatureService } from '@legislative-tracker/client-angular/core';

export const billTitleResolver: ResolveFn<string> = (
  route: ActivatedRouteSnapshot,
) => {
  const state =
    route.paramMap.get('stateCd') ||
    route.parent?.paramMap.get('stateCd') ||
    '';
  const id = route.paramMap.get('id') || '';
  if (!state || !id) return of('Bill | Legislative Tracker');

  const legislatureService = inject(LegislatureService);
  return legislatureService.getBillById(state, id).pipe(
    map((bill) => {
      const b = bill as any;
      if (b?.identifier) return `${b.identifier} | Legislative Tracker`;
      if (b?.title) return `${b.title} | Legislative Tracker`;
      if (b?.name) return `${b.name} | Legislative Tracker`;
      return 'Bill | Legislative Tracker';
    }),
  );
};

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
    title: billTitleResolver,
    loadComponent: () =>
      import('./bill-detail/bill-detail.component').then((m) => m.BillDetail),
  },
];
