import { Injectable } from '@angular/core';
import {
  FeedbackResponse,
  FeedbackType,
} from '@legislative-tracker/shared/models';

@Injectable()
export abstract class FeedbackService {
  abstract sendFeedback(
    title: string,
    body: string,
    type?: FeedbackType,
  ): Promise<FeedbackResponse>;
}
