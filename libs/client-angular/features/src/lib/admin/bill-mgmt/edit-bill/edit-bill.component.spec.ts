import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBill } from './edit-bill.component';

// Dependencies
import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';

describe('EditBill', () => {
  let component: EditBill;
  let fixture: ComponentFixture<EditBill>;

  const mockAuthService = {
    isAdmin: vi.fn().mockReturnValue(true),
    userProfile: vi.fn().mockReturnValue({ displayName: 'Admin User' }),
  };

  const mockLegislatureService = {
    getLegislationByState: vi.fn().mockReturnValue(of([])),
    updateBill: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    mockLegislatureService.getLegislationByState.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [EditBill],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(EditBill, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EditBill);
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

  describe('Fetching & Selecting Bills', () => {
    it('should fetch bills when selectedState changes', async () => {
      const mockBillsData = [
        {
          id: 'LEG-1',
          name: 'Clean Water Act',
          description: 'Water quality standards',
          stateBillIds: { upper: 'S100', lower: 'A200' },
        } as any,
      ];
      mockLegislatureService.getLegislationByState.mockReturnValue(
        of(mockBillsData),
      );

      component.selectedState.set('us-ny');
      fixture.detectChanges();

      await TestBed.flushEffects();

      expect(mockLegislatureService.getLegislationByState).toHaveBeenCalledWith(
        'us-ny',
      );
      expect(component.availableBills().length).toBe(1);
      expect(component.availableBills()[0].name).toBe('Clean Water Act');
      expect(component.isLoadingBills()).toBe(false);
    });

    it('should populate form fields when a bill is selected', async () => {
      const mockBillsData = [
        {
          id: 'LEG-1',
          name: 'Clean Water Act',
          description: 'Water quality standards',
          upperBillId: 'S100',
          lowerBillId: 'A200',
          stateBillIds: { upper: 'S100', lower: 'A200' },
        } as any,
      ];
      mockLegislatureService.getLegislationByState.mockReturnValue(
        of(mockBillsData),
      );

      component.selectedState.set('us-ny');
      fixture.detectChanges();
      await TestBed.flushEffects();

      component.onBillChange('LEG-1');
      fixture.detectChanges();

      expect(component.name()).toBe('Clean Water Act');
      expect(component.description()).toBe('Water quality standards');
      expect(component.upperBillId()).toBe('S100');
      expect(component.lowerBillId()).toBe('A200');
    });

    it('should handle errors when fetching bills fails', async () => {
      mockLegislatureService.getLegislationByState.mockReturnValue(
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
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.selectedState.set('us-ny');
      component.selectedBillId.set('LEG-1');
      component.name.set('Updated Title');
      component.description.set('Updated Description');
      component.upperBillId.set('S101');
      component.lowerBillId.set('A201');
    });

    it('should update bill and refresh list on success', async () => {
      mockLegislatureService.updateBill.mockResolvedValue({ success: true });
      const fetchSpy = vi.spyOn(component, 'fetchBillsForState');

      await component.onSubmit();

      expect(mockLegislatureService.updateBill).toHaveBeenCalledWith({
        state: 'us-ny',
        id: 'LEG-1',
        name: 'Updated Title',
        description: 'Updated Description',
        upperBillId: 'S101',
        lowerBillId: 'A201',
      });

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Legislation updated successfully.',
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );

      expect(fetchSpy).toHaveBeenCalledWith('us-ny');
      expect(component.isSaving()).toBe(false);
    });

    it('should show error if update fails', async () => {
      const errorMsg = 'Update Failed Error';
      mockLegislatureService.updateBill.mockRejectedValue(new Error(errorMsg));

      await component.onSubmit();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        errorMsg,
        'Close',
        expect.objectContaining({ panelClass: ['error-snackbar'] }),
      );

      expect(component.isSaving()).toBe(false);
    });
  });
});
