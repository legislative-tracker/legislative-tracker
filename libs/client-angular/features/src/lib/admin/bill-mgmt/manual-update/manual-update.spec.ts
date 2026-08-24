import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Target Component
import { ManualUpdate } from './manual-update';

// Dependencies
import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';

describe('ManualUpdate', () => {
  let component: ManualUpdate;
  let fixture: ComponentFixture<ManualUpdate>;

  const isAdminSignal = signal(true);

  const mockAuthService = {
    isAdmin: isAdminSignal,
  };

  const mockLegislatureService = {
    manualUpdateLegislation: vi.fn(),
    manualUpdateLegislators: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    isAdminSignal.set(true);

    await TestBed.configureTestingModule({
      imports: [ManualUpdate],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(ManualUpdate, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ManualUpdate);
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

  it('should show access denied if user is not an admin', () => {
    isAdminSignal.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.access-denied')).toBeTruthy();
    expect(compiled.querySelector('.update-card')).toBeFalsy();
  });

  describe('triggerLegislationUpdate', () => {
    it('should call legislatureService.manualUpdateLegislation and show success snackbar', async () => {
      mockLegislatureService.manualUpdateLegislation.mockResolvedValueOnce({
        data: { status: 'success' },
      });

      await component.triggerLegislationUpdate();

      expect(
        mockLegislatureService.manualUpdateLegislation,
      ).toHaveBeenCalledTimes(1);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Legislation data sync completed successfully.',
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );
      expect(component.isUpdatingLegislation()).toBe(false);
    });

    it('should show error snackbar when manualUpdateLegislation fails', async () => {
      const errorMsg = 'Network error while syncing legislation';
      mockLegislatureService.manualUpdateLegislation.mockRejectedValueOnce(
        new Error(errorMsg),
      );

      await component.triggerLegislationUpdate();

      expect(
        mockLegislatureService.manualUpdateLegislation,
      ).toHaveBeenCalledTimes(1);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        errorMsg,
        'Close',
        expect.objectContaining({ panelClass: ['error-snackbar'] }),
      );
      expect(console.error).toHaveBeenCalled();
      expect(component.isUpdatingLegislation()).toBe(false);
    });
  });

  describe('triggerLegislatorsUpdate', () => {
    it('should call legislatureService.manualUpdateLegislators and show success snackbar', async () => {
      mockLegislatureService.manualUpdateLegislators.mockResolvedValueOnce({
        data: { status: 'success' },
      });

      await component.triggerLegislatorsUpdate();

      expect(
        mockLegislatureService.manualUpdateLegislators,
      ).toHaveBeenCalledTimes(1);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Legislators data sync completed successfully.',
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );
      expect(component.isUpdatingLegislators()).toBe(false);
    });

    it('should show error snackbar when manualUpdateLegislators fails', async () => {
      const errorMsg = 'Network error while syncing legislators';
      mockLegislatureService.manualUpdateLegislators.mockRejectedValueOnce(
        new Error(errorMsg),
      );

      await component.triggerLegislatorsUpdate();

      expect(
        mockLegislatureService.manualUpdateLegislators,
      ).toHaveBeenCalledTimes(1);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        errorMsg,
        'Close',
        expect.objectContaining({ panelClass: ['error-snackbar'] }),
      );
      expect(console.error).toHaveBeenCalled();
      expect(component.isUpdatingLegislators()).toBe(false);
    });
  });
});
