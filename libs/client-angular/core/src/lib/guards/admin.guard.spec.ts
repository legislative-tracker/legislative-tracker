import { TestBed } from '@angular/core/testing';
import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom, isObservable } from 'rxjs';

import { adminGuard } from './admin.guard';
import { FIREBASE_AUTH } from '../firebase-tokens.token';

const mockOnAuthStateChanged = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
}));

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  let routerSpy: { createUrlTree: ReturnType<typeof vi.fn> };
  let mockAuth: any = {};

  beforeEach(() => {
    routerSpy = { createUrlTree: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: FIREBASE_AUTH, useValue: mockAuth },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to /login if user is not authenticated', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb(null);
      return () => {};
    });

    const mockUrlTree = {} as UrlTree;
    routerSpy.createUrlTree.mockReturnValue(mockUrlTree);

    const result = await runGuard();

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(mockUrlTree);
  });

  it('should redirect to / (Home) if user is logged in but NOT admin', async () => {
    const mockUser = {
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { admin: false },
      }),
    };
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb(mockUser);
      return () => {};
    });

    const mockUrlTree = {} as UrlTree;
    routerSpy.createUrlTree.mockReturnValue(mockUrlTree);

    const result = await runGuard();

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBe(mockUrlTree);
  });

  it('should allow access (return true) if user IS admin', async () => {
    const mockUser = {
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { admin: true },
      }),
    };
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb(mockUser);
      return () => {};
    });

    const result = await runGuard();

    expect(result).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  async function runGuard() {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    const result$ = executeGuard(route, state);
    if (isObservable(result$)) {
      return await firstValueFrom(result$);
    }
    return result$;
  }
});
