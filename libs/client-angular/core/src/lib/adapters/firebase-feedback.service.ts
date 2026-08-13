import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FeedbackResponse } from '@legislative-tracker/shared/models';
import { FeedbackService } from '../services/feedback.service';

@Injectable({ providedIn: 'root' })
export class FirebaseFeedbackService implements FeedbackService {
  private functions = inject(Functions);

  async sendFeedback(title: string, body: string): Promise<FeedbackResponse> {
    const submitIssue = httpsCallable(this.functions, 'submitAnonymousIssue');
    const result = await submitIssue({ title, body });
    return result.data as FeedbackResponse;
  }
}
