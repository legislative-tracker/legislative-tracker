// frontend/src/app/core/feedback.service.ts
import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

// App imports
import { FeedbackResponse } from '@legislative-tracker/shared/models';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private functions = inject(Functions);

  async sendFeedback(title: string, body: string): Promise<FeedbackResponse> {
    const submitIssue = httpsCallable(this.functions, 'submitAnonymousIssue');

    const result = await submitIssue({ title, body });
    return result.data as FeedbackResponse;
  }
}
