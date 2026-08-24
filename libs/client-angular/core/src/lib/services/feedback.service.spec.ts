import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { FeedbackService } from './feedback.service';
import { FirebaseFeedbackService } from '../adapters/firebase-feedback.service';
import { FIREBASE_FUNCTIONS } from '../firebase-tokens.token';

const mockHttpsCallable = vi.fn();

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}));

describe('FirebaseFeedbackService', () => {
  let service: FeedbackService;
  const mockFunctions = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FeedbackService, useClass: FirebaseFeedbackService },
        { provide: FIREBASE_FUNCTIONS, useValue: mockFunctions },
      ],
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
    it('should call the "system-submitAnonymousIssue" cloud function with correct payload', async () => {
      const mockResponse = {
        data: {
          success: true,
          issueNumber: 12,
          issueUrl:
            'https://github.com/legislative-tracker/legislative-tracker/issues/12',
        },
      };
      const callableFn = vi.fn().mockResolvedValue(mockResponse);
      mockHttpsCallable.mockReturnValue(callableFn);

      const title = 'Bug Report';
      const body = 'Something went wrong.';
      const type = 'bug';

      const result = await service.sendFeedback(title, body, type);

      expect(mockHttpsCallable).toHaveBeenCalledWith(
        mockFunctions,
        'system-submitAnonymousIssue',
      );

      expect(callableFn).toHaveBeenCalledWith({ title, body, type });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error if the cloud function fails', async () => {
      const callableFn = vi.fn().mockRejectedValue(new Error('Network Error'));
      mockHttpsCallable.mockReturnValue(callableFn);

      await expect(service.sendFeedback('Title', 'Body')).rejects.toThrow(
        'Network Error',
      );
    });
  });
});
