import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { UserManagementService } from './user-management.service';
import { FirebaseUserManagementService } from '../adapters/firebase-user-management.service';
import { FIREBASE_FUNCTIONS } from '../firebase-tokens.token';

const mockHttpsCallable = vi.fn();

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}));

describe('FirebaseUserManagementService', () => {
  let service: UserManagementService;
  const mockFunctions = {};

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserManagementService,
          useClass: FirebaseUserManagementService,
        },
        { provide: FIREBASE_FUNCTIONS, useValue: mockFunctions },
      ],
    });

    service = TestBed.inject(UserManagementService);

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
      const successResponse = { data: { message: 'Success' } };
      const callableFn = vi.fn().mockResolvedValue(successResponse);
      mockHttpsCallable.mockReturnValue(callableFn);

      const email = 'test@example.com';
      const result = await service.grantAdminPrivileges(email);

      expect(mockHttpsCallable).toHaveBeenCalledWith(
        mockFunctions,
        'admin-addAdminRole',
      );

      expect(callableFn).toHaveBeenCalledWith({ email });
      expect(console.log).toHaveBeenCalledWith(
        'Promotion successful:',
        successResponse.data,
      );
      expect(result).toEqual(successResponse);
    });

    it('should handle errors when granting privileges fails', async () => {
      const errorObj = new Error('Permission Denied');
      const callableFn = vi.fn().mockRejectedValue(errorObj);
      mockHttpsCallable.mockReturnValue(callableFn);

      await expect(
        service.grantAdminPrivileges('fail@example.com'),
      ).rejects.toThrow('Permission Denied');

      expect(console.error).toHaveBeenCalledWith('Promotion failed:', errorObj);
    });
  });

  describe('revokeAdminPrivileges', () => {
    it('should call "removeAdminRole" cloud function and return result', async () => {
      const successResponse = { data: { message: 'Demoted' } };
      const callableFn = vi.fn().mockResolvedValue(successResponse);
      mockHttpsCallable.mockReturnValue(callableFn);

      const email = 'admin@example.com';
      const result = await service.revokeAdminPrivileges(email);

      expect(mockHttpsCallable).toHaveBeenCalledWith(
        mockFunctions,
        'admin-removeAdminRole',
      );

      expect(callableFn).toHaveBeenCalledWith({ email });
      expect(console.log).toHaveBeenCalledWith(
        'Demotion successful:',
        successResponse.data,
      );
      expect(result).toEqual(successResponse);
    });

    it('should handle errors when revoking privileges fails', async () => {
      const errorObj = new Error('Network Error');
      const callableFn = vi.fn().mockRejectedValue(errorObj);
      mockHttpsCallable.mockReturnValue(callableFn);

      await expect(
        service.revokeAdminPrivileges('fail@example.com'),
      ).rejects.toThrow('Network Error');

      expect(console.error).toHaveBeenCalledWith('Demotion failed:', errorObj);
    });
  });
});
