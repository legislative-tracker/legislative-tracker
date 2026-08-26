import { Injectable } from '@angular/core';
import {
  FeedbackResponse,
  FeedbackType,
} from '@legislative-tracker/shared/models';
import { FeedbackService } from '../services/feedback.service';

@Injectable({ providedIn: 'root' })
export class MockFeedbackService implements FeedbackService {
  async sendFeedback(
    title: string,
    body: string,
    type?: FeedbackType,
  ): Promise<FeedbackResponse> {
    return {
      success: true,
      issueUrl:
        'https://github.com/legislative-tracker/legislative-tracker/issues/1',
      issueNumber: 1,
    };
  }
}
