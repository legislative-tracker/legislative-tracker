import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Target Component
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
        provideNoopAnimations(),
        { provide: UserManagementService, useValue: mockUserMgmt },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(AddAdmin, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AddAdmin);
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
      const testEmail = 'new-admin@example.com';
      component.email.set(testEmail);
      mockUserMgmt.grantAdminPrivileges.mockResolvedValue({ data: 'success' });

      await component.promoteUser();

      expect(mockUserMgmt.grantAdminPrivileges).toHaveBeenCalledWith(testEmail);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Success'),
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );

      expect(component.email()).toBe('');
      expect(component.isLoading()).toBe(false);
    });

    it('should show error snackbar if service fails', async () => {
      const errorMsg = 'Permission Denied';
      component.email.set('fail@example.com');
      mockUserMgmt.grantAdminPrivileges.mockRejectedValue(new Error(errorMsg));

      await component.promoteUser();

      expect(mockUserMgmt.grantAdminPrivileges).toHaveBeenCalled();

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
