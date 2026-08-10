import { TestBed } from '@angular/core/testing';
import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';

import { adminGuard } from './admin.guard';

// Mock the specific Firebase Auth functions we rely on
vi.mock('@angular/fire/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular/fire/auth')>();
  return {
    ...actual,
    authState: vi.fn(),
  };
});

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  let routerSpy: { createUrlTree: ReturnType<typeof vi.fn> };
  // We don't need a real Auth object, just a token placeholder
  let mockAuth: any = {};

  beforeEach(() => {
    routerSpy = { createUrlTree: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to /login if user is not authenticated', async () => {
    // Mock authState to emit "null" (logged out)
    (authState as any).mockReturnValue(of(null));

    const mockUrlTree = {} as UrlTree;
    routerSpy.createUrlTree.mockReturnValue(mockUrlTree);

    const result = await runGuard();

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(mockUrlTree);
  });

  it('should redirect to / (Home) if user is logged in but NOT admin', async () => {
    // Mock a standard user without claims
    const mockUser = {
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { admin: false },
      }),
    };
    (authState as any).mockReturnValue(of(mockUser));

    const mockUrlTree = {} as UrlTree;
    routerSpy.createUrlTree.mockReturnValue(mockUrlTree);

    const result = await runGuard();

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(mockUrlTree);
  });

  it('should allow access (return true) if user IS admin', async () => {
    // Mock an admin user
    const mockUser = {
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { admin: true },
      }),
    };
    (authState as any).mockReturnValue(of(mockUser));

    const result = await runGuard();

    expect(result).toBe(true);
    // Ensure we didn't redirect
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  // --- Helper to handle the Observable/Promise return type ---
  async function runGuard() {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    // The guard returns an Observable, so we convert it to a Promise for the test
    const result$ = executeGuard(route, state) as any;
    return await result$.toPromise();
  }
});
