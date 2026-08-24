import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { Login } from './login.component';

// Dependencies
import { AuthService } from '@legislative-tracker/client-angular/core';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;

  // Mock Auth Service
  const mockAuthService = {
    loginWithGoogle: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login], // Standalone
      providers: [
        // Use real router infrastructure so we can spy on it
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    // Inject the router to spy on it
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    // Spy on console.error to keep test output clean and verify exception handling
    vi.spyOn(console, 'error').mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /profile on successful login', async () => {
    // Mock success response (truthy)
    mockAuthService.loginWithGoogle.mockResolvedValue({ uid: '123' });

    // Trigger Action
    await component.loginWithGoogle();

    // Assert Navigation
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);

    // Assert Error State is clear
    expect(component.authError()).toBeNull();
  });

  it('should set authError when login returns null/false (User cancelled or failed)', async () => {
    // Mock failure response (falsy)
    mockAuthService.loginWithGoogle.mockResolvedValue(null);

    // Trigger Action
    await component.loginWithGoogle();

    // Assert NO Navigation
    expect(router.navigate).not.toHaveBeenCalled();

    // Assert Error Signal
    expect(component.authError()).toBe(
      'Unable to authenticate with Google. Please try again.',
    );
  });

  it('should log errors to console when exception occurs', async () => {
    // Mock Exception
    const mockError = { code: 'auth/error', message: 'Something went wrong' };
    mockAuthService.loginWithGoogle.mockRejectedValue(mockError);

    // Trigger Action
    await component.loginWithGoogle();

    // Verify Console Logs (matches your catch block)
    expect(console.error).toHaveBeenCalledWith(
      'Auth Error Code:',
      'auth/error',
    );
    expect(console.error).toHaveBeenCalledWith(
      'Auth Error Message:',
      'Something went wrong',
    );

    // Verify user stays on page
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
