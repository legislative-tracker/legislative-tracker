import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBill } from './add-bill.component';

// Dependencies
import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';

describe('AddBill', () => {
  let component: AddBill;
  let fixture: ComponentFixture<AddBill>;

  const mockLegislatureService = {
    addBills: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  const mockAuthService = {
    isAdmin: vi.fn().mockReturnValue(true),
    userProfile: vi.fn().mockReturnValue({ displayName: 'Admin' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBill],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideComponent(AddBill, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AddBill);
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

  describe('onSubmit', () => {
    it('should return early if state or name is empty', async () => {
      component.state.set('us-ny');
      component.name.set('');

      await component.onSubmit();

      expect(mockLegislatureService.addBills).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should add bills, show success snackbar, and reset form on success', async () => {
      component.state.set('us-ny');
      component.name.set('Clean Energy Infrastructure Act');
      component.upperBillId.set('S1234');
      component.lowerBillId.set('A5678');

      mockLegislatureService.addBills.mockResolvedValue({ success: true });

      await component.onSubmit();

      expect(mockLegislatureService.addBills).toHaveBeenCalledWith({
        state: 'us-ny',
        name: 'Clean Energy Infrastructure Act',
        description: undefined,
        billIds: ['S1234', 'A5678'],
      });

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Success'),
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );

      expect(component.state()).toBe('');
      expect(component.name()).toBe('');
      expect(component.upperBillId()).toBe('');
      expect(component.lowerBillId()).toBe('');
      expect(component.isLoading()).toBe(false);
    });

    it('should show error snackbar if service fails', async () => {
      component.state.set('us-ny');
      component.name.set('Test Act');
      component.upperBillId.set('S100');

      const errorMsg = 'Database Error';
      mockLegislatureService.addBills.mockRejectedValue(new Error(errorMsg));

      await component.onSubmit();

      expect(mockLegislatureService.addBills).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        errorMsg,
        'Close',
        expect.objectContaining({ panelClass: ['error-snackbar'] }),
      );

      expect(component.state()).toBe('us-ny');
      expect(component.name()).toBe('Test Act');
      expect(component.isLoading()).toBe(false);
    });
  });
});
