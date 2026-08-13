import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FirebaseApp } from '@angular/fire/app';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Target Component
import { RemoveBill } from './remove-bill';

// Dependencies
import {
  AuthService,
  LegislatureService,
} from '@legislative-tracker/client-angular/core';

// -------------------------------------------------------------------------
// Mock Dynamic Imports (Firestore)
// -------------------------------------------------------------------------
const mockGetFirestore = vi.fn().mockReturnValue({});
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockGetDocs = vi.fn();

vi.mock('@angular/fire/firestore', () => ({
  getFirestore: (...args: any[]) => mockGetFirestore(...args),
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
}));

describe('RemoveBill', () => {
  let component: RemoveBill;
  let fixture: ComponentFixture<RemoveBill>;

  // Mock Services
  const mockAuthService = {
    isAdmin: vi.fn().mockReturnValue(true),
    userProfile: vi.fn().mockReturnValue({ displayName: 'Admin User' }),
  };

  const mockLegislatureService = {
    removeBill: vi.fn(),
  };
  const mockSnackBar = {
    open: vi.fn(),
  };
  const mockFirebaseApp = { name: '[DEFAULT]' };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Restore mock values immediately after clearing
    mockGetFirestore.mockReturnValue({});
    mockGetDocs.mockResolvedValue({ docs: [] }); // Prevent crash if effect runs early

    await TestBed.configureTestingModule({
      imports: [RemoveBill],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: FirebaseApp, useValue: mockFirebaseApp },
      ],
    })
      .overrideComponent(RemoveBill, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RemoveBill);
    component = fixture.componentInstance;

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

  describe('Fetching Bills (Effect & Firestore)', () => {
    it('should fetch bills when selectedState changes', async () => {
      const mockSnapshot = {
        docs: [
          { id: '1', data: () => ({ id: 'BILL-1', title: 'Test Bill' }) },
          { id: '2', data: () => ({ id: 'BILL-2', title: 'Other Bill' }) },
        ],
      };
      mockGetDocs.mockResolvedValue(mockSnapshot);

      component.selectedState.set('ny');
      fixture.detectChanges();

      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockGetFirestore).toHaveBeenCalledWith(mockFirebaseApp);
      // Now mockGetFirestore returns {}, so expect.anything() passes
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'legislatures/ny/legislation',
      );
      expect(mockGetDocs).toHaveBeenCalled();

      expect(component.availableBills().length).toBe(2);
      expect(component.availableBills()[0].title).toBe('Test Bill');
      expect(component.isLoadingBills()).toBe(false);
    });

    it('should handle errors when fetching bills fails', async () => {
      mockGetDocs.mockRejectedValue(new Error('Firestore Error'));

      component.selectedState.set('ca');
      fixture.detectChanges();

      await TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 0));

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
      component.selectedState.set('ny');
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
      // Ensure the re-fetch gets a valid empty snapshot
      mockGetDocs.mockResolvedValue({ docs: [] });

      await component.onDelete();

      expect(mockLegislatureService.removeBill).toHaveBeenCalledWith(
        'ny',
        'BILL-123',
      );

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Bill deleted successfully.',
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );

      expect(fetchSpy).toHaveBeenCalledWith('ny');
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
