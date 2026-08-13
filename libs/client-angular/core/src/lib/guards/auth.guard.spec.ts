import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  // Helper to execute the functional guard in context
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  // Define mocks
  let authServiceSpy: { isLoggedIn: ReturnType<typeof vi.fn> };
  let routerSpy: { parseUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Setup spy objects
    authServiceSpy = { isLoggedIn: vi.fn() };
    routerSpy = { parseUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should allow navigation (return true) if user is logged in', () => {
    // Mock the Signal: isLoggedIn() returns true
    authServiceSpy.isLoggedIn.mockReturnValue(true);

    const result = executeGuard({} as any, {} as any);

    expect(result).toBe(true);
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('should redirect to /login if user is NOT logged in', () => {
    // Mock the Signal: isLoggedIn() returns false
    authServiceSpy.isLoggedIn.mockReturnValue(false);

    // Mock the Router returning a UrlTree
    const dummyUrlTree = {} as UrlTree;
    routerSpy.parseUrl.mockReturnValue(dummyUrlTree);

    const result = executeGuard({} as any, {} as any);

    // Verify logic
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(dummyUrlTree);
  });
});
