import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Target Component
import { FirebaseApp } from '@angular/fire/app';
import { AddAdmin } from './add-admin';

// Dependencies
import { UserManagementService } from '@legislative-tracker/client-angular/core';

describe('AddAdmin', () => {
  let component: AddAdmin;
  let fixture: ComponentFixture<AddAdmin>;

  // Mock Dependencies
  const mockUserMgmt = {
    grantAdminPrivileges: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAdmin], // Standalone
      providers: [
        // Prevent animation errors from Material components
        provideNoopAnimations(),

        // Mock the services
        { provide: UserManagementService, useValue: mockUserMgmt },
        // Provide mock SnackBar (must override module import below)
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: FirebaseApp, useValue: { name: '[DEFAULT]' } },
      ],
    })
      // ✅ CRITICAL: Remove MatSnackBarModule from imports so the component
      // uses our Mock Provider instead of the real Material implementation.
      .overrideComponent(AddAdmin, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AddAdmin);
    component = fixture.componentInstance;

    // Reset mocks
    vi.clearAllMocks();

    // Spy on console.error to keep test output clean during error scenarios
    vi.spyOn(console, 'error').mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to empty email and not loading', () => {
    expect(component.email()).toBe('');
    expect(component.isLoading()).toBe(false);
  });

  describe('promoteUser', () => {
    it('should do nothing if email is empty', async () => {
      component.email.set('');

      await component.promoteUser();

      expect(mockUserMgmt.grantAdminPrivileges).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should call service, show success snackbar, and clear form on success', async () => {
      // Setup Success Logic
      const testEmail = 'new-admin@example.com';
      component.email.set(testEmail);
      mockUserMgmt.grantAdminPrivileges.mockResolvedValue({ data: 'success' });

      // Execute
      await component.promoteUser();

      // Verify Service Call
      expect(mockUserMgmt.grantAdminPrivileges).toHaveBeenCalledWith(testEmail);

      // Verify Snackbar (Success Message)
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Success'),
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );

      // Verify State Updates
      expect(component.email()).toBe(''); // Form cleared
      expect(component.isLoading()).toBe(false);
    });

    it('should show error snackbar if service fails', async () => {
      // Setup Error Logic
      const errorMsg = 'Permission Denied';
      component.email.set('fail@example.com');
      mockUserMgmt.grantAdminPrivileges.mockRejectedValue(new Error(errorMsg));

      // Execute
      await component.promoteUser();

      // Verify Service Call
      expect(mockUserMgmt.grantAdminPrivileges).toHaveBeenCalled();

      // Verify Snackbar (Error Message)
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        errorMsg,
        'Close',
        expect.objectContaining({ panelClass: ['error-snackbar'] }),
      );

      // Verify Console Error was triggered (and suppressed)
      expect(console.error).toHaveBeenCalled();

      // Verify State (Loading reset, email NOT cleared so user can retry)
      expect(component.isLoading()).toBe(false);
      expect(component.email()).toBe('fail@example.com');
    });
  });
});
