import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from 'firebase/functions';
import { FeedbackResponse } from '@legislative-tracker/shared/models';
import { FeedbackService } from '../services/feedback.service';
import { FIREBASE_FUNCTIONS } from '../firebase-tokens';

@Injectable({ providedIn: 'root' })
export class FirebaseFeedbackService implements FeedbackService {
  private functions = inject<Functions>(FIREBASE_FUNCTIONS, { optional: true });

  async sendFeedback(title: string, body: string): Promise<FeedbackResponse> {
    if (!this.functions) throw new Error('Firebase Functions not provided');
    const submitIssue = httpsCallable(this.functions, 'submitAnonymousIssue');
    const result = await submitIssue({ title, body });
    return result.data as FeedbackResponse;
  }
}
