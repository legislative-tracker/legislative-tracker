import { Injectable } from '@angular/core';
import { FeedbackResponse } from '@legislative-tracker/shared/models';

@Injectable()
export abstract class FeedbackService {
  abstract sendFeedback(title: string, body: string): Promise<FeedbackResponse>;
}
