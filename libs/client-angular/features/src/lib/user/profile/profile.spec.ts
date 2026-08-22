import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Target Component
import { Profile } from './profile';

// Dependencies
import {
  AuthService,
  FIREBASE_FUNCTIONS,
} from '@legislative-tracker/client-angular/core';
import {
  AddressForm,
  TableComponent,
} from '@legislative-tracker/client-angular/ui';

// -------------------------------------------------------------------------
// Mock Dynamic Imports & Firebase Functions
// -------------------------------------------------------------------------
const mockCallableFunction = vi.fn();
const mockHttpsCallable = vi.fn().mockReturnValue(mockCallableFunction);

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}));

// -------------------------------------------------------------------------
// Mock Child Components
// -------------------------------------------------------------------------
@Component({
  selector: 'app-address-form',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['formType'],
})
class MockAddressForm {}

@Component({
  selector: 'app-table',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['dataSource', 'columnSource', 'routeType', 'stateCd'],
})
class MockTableComponent {}

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  // Helper to simulate a Firestore Timestamp
  const mockTimestamp = {
    toDate: () => new Date('2024-01-01'),
    toMillis: () => 1704067200000,
  };

  // Mock Services
  const mockAuthService = {
    userProfile: signal({
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      lastLogin: mockTimestamp,
      legislators: null,
    }),
  };

  const mockFunctions = {};
  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        DatePipe,
        { provide: AuthService, useValue: mockAuthService },
        { provide: FIREBASE_FUNCTIONS, useValue: mockFunctions },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(Profile, {
        remove: { imports: [AddressForm, TableComponent, MatSnackBarModule] },
        add: { imports: [MockAddressForm, MockTableComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize user data from AuthService', () => {
    expect(component.user()?.displayName).toBe('Test User');
    expect(component.user()?.email).toBe('test@example.com');
  });

  it('should set legislatorCols to name, party, chamber, and district columns', () => {
    expect(component.legislatorCols).toEqual([
      { key: 'name', label: 'Name' },
      { key: 'party', label: 'Party' },
      { key: 'chamber', label: 'Chamber' },
      { key: 'district', label: 'District' },
    ]);
  });

  describe('searchAddress', () => {
    it('should construct address string and call cloud function successfully', async () => {
      mockCallableFunction.mockResolvedValue({ data: { success: true } });

      const searchData = {
        address: '123 Main St',
        address2: 'Apt 4B',
        city: 'Albany',
        state: 'NY',
        postalCode: 12201,
      };

      await component.searchAddress(searchData);

      expect(mockHttpsCallable).toHaveBeenCalledWith(
        mockFunctions,
        'users-fetchUserReps',
      );

      expect(mockCallableFunction).toHaveBeenCalledWith({
        address: '123 Main St, Apt 4B, Albany, NY 12201',
      });

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Representatives search completed successfully!',
        'Close',
        expect.objectContaining({ panelClass: ['success-snackbar'] }),
      );
    });

    it('should format address correctly without address2', async () => {
      mockCallableFunction.mockResolvedValue({});

      const searchData = {
        address: '123 Main St',
        city: 'Albany',
        state: 'NY',
        postalCode: '12201',
      } as any;

      await component.searchAddress(searchData);

      expect(mockCallableFunction).toHaveBeenCalledWith({
        address: '123 Main St, Albany, NY 12201',
      });
    });

    it('should handle errors thrown by the cloud function', async () => {
      const errorObj = new Error('Cloud function failed');
      mockCallableFunction.mockRejectedValue(errorObj);

      const searchData = {
        address: '123 Main St',
        city: 'A',
        state: 'NY',
        postalCode: '12345',
      } as any;

      await component.searchAddress(searchData);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Cloud function failed',
        'Close',
        expect.objectContaining({ panelClass: ['error-snackbar'] }),
      );
    });
  });
});
