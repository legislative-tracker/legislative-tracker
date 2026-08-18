import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ComponentFixture, TestBed } from '@angular/core/testing';

// Target Component
import { RemoveBill } from './remove-bill';

// Dependencies
import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';

describe('RemoveBill', () => {
  let component: RemoveBill;
  let fixture: ComponentFixture<RemoveBill>;

  const mockAuthService = {
    isAdmin: vi.fn().mockReturnValue(true),
    userProfile: vi.fn().mockReturnValue({ displayName: 'Admin User' }),
  };

  const mockLegislatureService = {
    getBillsByState: vi.fn().mockReturnValue(of([])),
    removeBill: vi.fn(),
  };
  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    mockLegislatureService.getBillsByState.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [RemoveBill],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(RemoveBill, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RemoveBill);
    component = fixture.componentInstance;

    vi.clearAllMocks();
    vi.spyOn(window, 'confirm');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Fetching Bills', () => {
    it('should fetch bills when selectedState changes', async () => {
      const mockBillsData = [
        { id: 'BILL-1', title: 'Test Bill' } as any,
        { id: 'BILL-2', title: 'Other Bill' } as any,
      ];
      mockLegislatureService.getBillsByState.mockReturnValue(of(mockBillsData));

      component.selectedState.set('us-ny');
      fixture.detectChanges();

      await TestBed.flushEffects();

      expect(mockLegislatureService.getBillsByState).toHaveBeenCalledWith(
        'us-ny',
      );
      expect(component.availableBills().length).toBe(2);
      expect(component.availableBills()[0].title).toBe('Test Bill');
      expect(component.isLoadingBills()).toBe(false);
    });

    it('should handle errors when fetching bills fails', async () => {
      mockLegislatureService.getBillsByState.mockReturnValue(
        throwError(() => new Error('Service Error')),
      );

      component.selectedState.set('us-ca');
      fixture.detectChanges();

      await TestBed.flushEffects();

      expect(component.availableBills()).toEqual([]);
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Could not load bills for this state.',
        'Close',
      );
      expect(console.error).toHaveBeenCalled();
      expect(component.isLoadingBills()).toBe(false);
    });
  });

  describe('onDelete', () => {
    beforeEach(() => {
      component.selectedState.set('us-ny');
      component.selectedBillId.set('BILL-123');
    });

    it('should abort if user cancels confirmation', async () => {
      vi.mocked(window.confirm).mockReturnValue(false);

      await component.onDelete();

      expect(window.confirm).toHaveBeenCalled();
      expect(mockLegislatureService.removeBill).not.toHaveBeenCalled();
    });

    it('should delete bill and refresh list on success', async () => {
      vi.mocked(window.confirm).mockReturnValue(true);
      mockLegislatureService.removeBill.mockResolvedValue({ success: true });

      const fetchSpy = vi.spyOn(component, 'fetchBillsForState');

      await component.onDelete();

      expect(mockLegislatureService.removeBill).toHaveBeenCalledWith(
        'us-ny',
        'BILL-123',
        undefined,
      );

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Bill removed successfully.',
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );

      expect(fetchSpy).toHaveBeenCalledWith('us-ny');
      expect(component.isDeleting()).toBe(false);
    });

    it('should show error if deletion fails', async () => {
      vi.mocked(window.confirm).mockReturnValue(true);
      const errorMsg = 'Cloud Function Error';
      mockLegislatureService.removeBill.mockRejectedValue(new Error(errorMsg));

      await component.onDelete();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        errorMsg,
        'Close',
        expect.objectContaining({ panelClass: ['error-snackbar'] }),
      );

      expect(component.isDeleting()).toBe(false);
    });
  });
});
