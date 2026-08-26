import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { Login } from './login.component';

// Dependencies
import { AuthService } from '@legislative-tracker/client-angular/core';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;

  // Mock Auth Service
  const mockAuthService = {
    loginWithProvider: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all 3 provider buttons in the DOM', () => {
    const buttons = fixture.debugElement.queryAll(By.css('.auth-provider-btn'));
    expect(buttons.length).toBe(3);

    const buttonTexts = buttons.map((b) => b.nativeElement.textContent.trim());
    expect(buttonTexts).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Sign in with Google'),
        expect.stringContaining('Sign in with Apple'),
        expect.stringContaining('Continue with Facebook'),
      ]),
    );
  });

  it('should navigate to /profile on successful Google login', async () => {
    mockAuthService.loginWithProvider.mockResolvedValue({ uid: '123' });

    await component.login('google');

    expect(mockAuthService.loginWithProvider).toHaveBeenCalledWith('google');
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    expect(component.authError()).toBeNull();
    expect(component.isLoading()).toBeNull();
  });

  it('should navigate to /profile on successful Apple login', async () => {
    mockAuthService.loginWithProvider.mockResolvedValue({ uid: 'apple-123' });

    await component.login('apple');

    expect(mockAuthService.loginWithProvider).toHaveBeenCalledWith('apple');
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    expect(component.authError()).toBeNull();
  });

  it('should navigate to /profile on successful Facebook login', async () => {
    mockAuthService.loginWithProvider.mockResolvedValue({ uid: 'fb-123' });

    await component.login('facebook');

    expect(mockAuthService.loginWithProvider).toHaveBeenCalledWith('facebook');
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    expect(component.authError()).toBeNull();
  });

  it('should set authError when login returns falsy', async () => {
    mockAuthService.loginWithProvider.mockResolvedValue(null);

    await component.login('google');

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.authError()).toBe(
      'Unable to authenticate with Google. Please try again.',
    );
  });

  it('should map account collision error to friendly message', async () => {
    mockAuthService.loginWithProvider.mockRejectedValue({
      code: 'auth/account-exists-with-different-credential',
      message: 'Account exists',
    });

    await component.login('facebook');

    expect(component.authError()).toBe(
      'An account already exists with the same email address using a different sign-in method. Please sign in with your original provider.',
    );
  });

  it('should map popup closed/cancelled error to friendly message', async () => {
    mockAuthService.loginWithProvider.mockRejectedValue({
      code: 'auth/popup-closed-by-user',
      message: 'Popup closed',
    });

    await component.login('google');

    expect(component.authError()).toBe(
      'Sign-in was cancelled. Please try again.',
    );
  });

  it('should map popup blocked error to friendly message', async () => {
    mockAuthService.loginWithProvider.mockRejectedValue({
      code: 'auth/popup-blocked',
      message: 'Popup blocked',
    });

    await component.login('apple');

    expect(component.authError()).toBe(
      'The sign-in popup was blocked by your browser. Please allow popups and try again.',
    );
  });

  it('should map network request error to friendly message', async () => {
    mockAuthService.loginWithProvider.mockRejectedValue({
      code: 'auth/network-request-failed',
      message: 'Network error',
    });

    await component.login('google');

    expect(component.authError()).toBe(
      'A network error occurred. Please check your internet connection and try again.',
    );
  });

  it('should map operation-not-allowed error to provider specific message', async () => {
    mockAuthService.loginWithProvider.mockRejectedValue({
      code: 'auth/operation-not-allowed',
      message: 'Not allowed',
    });

    await component.login('apple');

    expect(component.authError()).toBe(
      'Apple sign-in is not enabled. Please use another provider.',
    );
  });

  it('should map user-disabled error to friendly message', async () => {
    mockAuthService.loginWithProvider.mockRejectedValue({
      code: 'auth/user-disabled',
      message: 'Disabled',
    });

    await component.login('facebook');

    expect(component.authError()).toBe('This user account has been disabled.');
  });

  it('should map unknown error to fallback message', async () => {
    mockAuthService.loginWithProvider.mockRejectedValue({
      code: 'auth/unknown-error',
      message: 'Something broke',
    });

    await component.login('google');

    expect(component.authError()).toBe(
      'Unable to authenticate with Google. Please try again.',
    );
  });
});
