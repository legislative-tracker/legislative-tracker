import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

import { stateGuard } from './state.guard';
import { LegislaturePluginRegistry } from '@legislative-tracker/plugins-core';

const mockNyPlugin = {
  id: 'ny',
  jurisdiction: 'US-NY',
  name: 'New York State Legislature',
  updateMembers: async () => [],
  updateBills: async () => [],
};

describe('stateGuard', () => {
  // Helper to run the functional guard inside the Injection Context
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => stateGuard(...guardParameters));

  // Define a mock Router interface for TS typing
  let routerSpy: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    LegislaturePluginRegistry.register(mockNyPlugin as any);

    // Create the mock using vi.fn()
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

    // Mock the return value of createUrlTree
    const dummyUrlTree = {} as UrlTree;
    routerSpy.createUrlTree.mockReturnValue(dummyUrlTree);

    const result = executeGuard(route, state);

    // Verify the call and result
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/404']);
    expect(result).toBe(dummyUrlTree);
  });
});
