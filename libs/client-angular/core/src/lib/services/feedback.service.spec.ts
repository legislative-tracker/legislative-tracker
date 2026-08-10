import { TestBed } from '@angular/core/testing';
import { FirebaseApp } from '@angular/fire/app';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { FeedbackService } from './feedback.service';

// -------------------------------------------------------------------------
// Mock Dynamic Imports (Firebase Functions)
// -------------------------------------------------------------------------
const mockHttpsCallable = vi.fn();
const mockGetFunctions = vi.fn();

// Intercept the dynamic "await import(...)" call
vi.mock('@angular/fire/functions', () => ({
  getFunctions: (...args: any[]) => mockGetFunctions(...args),
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}));

describe('FeedbackService', () => {
  let service: FeedbackService;
  const mockFirebaseApp = { name: '[DEFAULT]' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeedbackService, { provide: FirebaseApp, useValue: mockFirebaseApp }],
    });
    service = TestBed.inject(FeedbackService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendFeedback', () => {
    it('should call the "submitAnonymousIssue" cloud function with correct payload', async () => {
      // Setup the callable function spy
      const mockResponse = { data: { success: true, message: 'Received' } };

      // The httpsCallable factory returns a function (the actual API caller)
      const callableFn = vi.fn().mockResolvedValue(mockResponse);
      mockHttpsCallable.mockReturnValue(callableFn);

      const title = 'Bug Report';
      const body = 'Something went wrong.';

      // Call the service method
      const result = await service.sendFeedback(title, body);

      // Verify Lazy Loading & Setup
      expect(mockGetFunctions).toHaveBeenCalledWith(mockFirebaseApp);
      expect(mockHttpsCallable).toHaveBeenCalledWith(undefined, 'submitAnonymousIssue');

      // Verify Payload
      expect(callableFn).toHaveBeenCalledWith({ title, body });

      // Verify Return Value
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if the cloud function fails', async () => {
      // Setup failure scenario
      const callableFn = vi.fn().mockRejectedValue(new Error('Network Error'));
      mockHttpsCallable.mockReturnValue(callableFn);

      // Call and Assert Rejection
      await expect(service.sendFeedback('Title', 'Body')).rejects.toThrow('Network Error');
    });
  });
});
