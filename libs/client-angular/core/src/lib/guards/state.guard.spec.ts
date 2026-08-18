import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { stateGuard } from './state.guard';
import { LegislaturePluginRegistry } from '@legislative-tracker/plugins-core';

const mockNyPlugin = {
  metadata: {
    id: 'ny',
    name: 'New York State Legislature',
    version: '1.0.0',
    jurisdiction: {
      id: 'ocd-jurisdiction/country:us/state:ny/government',
      code: 'us-ny',
      name: 'New York',
      isBicameral: true,
      chambers: { upper: 'Senate', lower: 'Assembly' },
      currentSession: '2025-2026',
    },
    capabilities: { hasApi: true },
  },
  calculateCurrentSession: () => '2025-2026',
};

describe('stateGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => stateGuard(...guardParameters));

  let routerSpy: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    LegislaturePluginRegistry.clear();
    await LegislaturePluginRegistry.register(mockNyPlugin as any);

    routerSpy = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerSpy }],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow navigation for an implemented state (e.g., "ny")', () => {
    const route = {
      params: { stateCd: 'ny' },
    } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = executeGuard(route, state);

    expect(result).toBe(true);
  });

  it('should normalize case and allow navigation for "NY"', () => {
    const route = {
      params: { stateCd: 'NY' },
    } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result = executeGuard(route, state);

    expect(result).toBe(true);
  });

  it('should redirect to /404 for an unauthorized state (e.g., "tx")', () => {
    const route = {
      params: { stateCd: 'tx' },
    } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const dummyUrlTree = {} as UrlTree;
    routerSpy.createUrlTree.mockReturnValue(dummyUrlTree);

    const result = executeGuard(route, state);

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/404']);
    expect(result).toBe(dummyUrlTree);
  });
});
