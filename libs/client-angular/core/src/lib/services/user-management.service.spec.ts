import { TestBed } from '@angular/core/testing';
import { FirebaseApp } from '@angular/fire/app';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { UserManagementService } from './user-management.service';

// -------------------------------------------------------------------------
// Mock Dynamic Imports (Firebase Functions)
// -------------------------------------------------------------------------
const mockHttpsCallable = vi.fn();
const mockGetFunctions = vi.fn();

// This intercepts "await import('@angular/fire/functions')"
vi.mock('@angular/fire/functions', () => ({
  getFunctions: (...args: any[]) => mockGetFunctions(...args),
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}));

describe('UserManagementService', () => {
  let service: UserManagementService;
  const mockFirebaseApp = { name: '[DEFAULT]' };

  beforeEach(() => {
    // Reset spies before every test
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [UserManagementService, { provide: FirebaseApp, useValue: mockFirebaseApp }],
    });

    service = TestBed.inject(UserManagementService);

    // Spy on console to verify logs and keep test output clean
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('grantAdminPrivileges', () => {
    it('should call "addAdminRole" cloud function and return result', async () => {
      // Setup Success Response
      const successResponse = { data: { message: 'Success' } };
      // The callable factory returns the actual function that makes the request
      const callableFn = vi.fn().mockResolvedValue(successResponse);
      mockHttpsCallable.mockReturnValue(callableFn);

      // Execute
      const email = 'test@example.com';
      const result = await service.grantAdminPrivileges(email);

      // Verify Lazy Loading & Setup
      expect(mockGetFunctions).toHaveBeenCalledWith(mockFirebaseApp);
      expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, 'admin-addAdminRole');

      // Verify Execution
      expect(callableFn).toHaveBeenCalledWith({ email });
      expect(console.log).toHaveBeenCalledWith('Promotion successful:', successResponse.data);
      expect(result).toEqual(successResponse);
    });

    it('should handle errors when granting privileges fails', async () => {
      // Setup Error Response
      const errorObj = new Error('Permission Denied');
      const callableFn = vi.fn().mockRejectedValue(errorObj);
      mockHttpsCallable.mockReturnValue(callableFn);

      // Execute & Assert
      await expect(service.grantAdminPrivileges('fail@example.com')).rejects.toThrow(
        'Permission Denied',
      );

      // Verify Logging
      expect(console.error).toHaveBeenCalledWith('Promotion failed:', errorObj);
    });
  });

  describe('revokeAdminPrivileges', () => {
    it('should call "removeAdminRole" cloud function and return result', async () => {
      // Setup Success Response
      const successResponse = { data: { message: 'Demoted' } };
      const callableFn = vi.fn().mockResolvedValue(successResponse);
      mockHttpsCallable.mockReturnValue(callableFn);

      // Execute
      const email = 'admin@example.com';
      const result = await service.revokeAdminPrivileges(email);

      // Verify Setup
      expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, 'admin-removeAdminRole');

      // Verify Execution
      expect(callableFn).toHaveBeenCalledWith({ email });
      expect(console.log).toHaveBeenCalledWith('Demotion successful:', successResponse.data);
      expect(result).toEqual(successResponse);
    });

    it('should handle errors when revoking privileges fails', async () => {
      // Setup Error Response
      const errorObj = new Error('Network Error');
      const callableFn = vi.fn().mockRejectedValue(errorObj);
      mockHttpsCallable.mockReturnValue(callableFn);

      // Execute & Assert
      await expect(service.revokeAdminPrivileges('fail@example.com')).rejects.toThrow(
        'Network Error',
      );

      // Verify Logging
      expect(console.error).toHaveBeenCalledWith('Demotion failed:', errorObj);
    });
  });
});
