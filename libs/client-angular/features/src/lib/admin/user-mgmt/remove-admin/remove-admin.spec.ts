import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Target Component
import { RemoveAdmin } from './remove-admin';

// Dependencies
import { UserManagementService } from '@legislative-tracker/client-angular/core';

describe('RemoveAdmin', () => {
  let component: RemoveAdmin;
  let fixture: ComponentFixture<RemoveAdmin>;

  // Mock Dependencies
  const mockUserMgmt = {
    revokeAdminPrivileges: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoveAdmin],
      providers: [
        provideNoopAnimations(),
        { provide: UserManagementService, useValue: mockUserMgmt },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(RemoveAdmin, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RemoveAdmin);
    component = fixture.componentInstance;

    vi.clearAllMocks();

    vi.spyOn(console, 'error').mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should defaults to empty email and not loading', () => {
    expect(component.email()).toBe('');
    expect(component.isLoading()).toBe(false);
  });

  describe('demoteAdmin', () => {
    it('should do nothing if email is empty', async () => {
      component.email.set('');

      await component.demoteAdmin();

      expect(mockUserMgmt.revokeAdminPrivileges).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should call service, show success snackbar, and clear form on success', async () => {
      const testEmail = 'admin@example.com';
      component.email.set(testEmail);
      mockUserMgmt.revokeAdminPrivileges.mockResolvedValue({ data: 'success' });

      await component.demoteAdmin();

      expect(mockUserMgmt.revokeAdminPrivileges).toHaveBeenCalledWith(
        testEmail,
      );

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Success'),
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );

      expect(component.email()).toBe('');
      expect(component.isLoading()).toBe(false);
    });

    it('should show error snackbar if service fails', async () => {
      const errorMsg = 'Network Error';
      component.email.set('fail@example.com');
      mockUserMgmt.revokeAdminPrivileges.mockRejectedValue(new Error(errorMsg));

      await component.demoteAdmin();

      expect(mockUserMgmt.revokeAdminPrivileges).toHaveBeenCalled();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        errorMsg,
        'Close',
        expect.objectContaining({ panelClass: ['error-snackbar'] }),
      );

      expect(console.error).toHaveBeenCalled();

      expect(component.isLoading()).toBe(false);
      expect(component.email()).toBe('fail@example.com');
    });
  });
});
