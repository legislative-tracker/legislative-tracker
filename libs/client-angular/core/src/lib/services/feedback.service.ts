// frontend/src/app/core/feedback.service.ts
import { inject, Injectable } from "@angular/core";
import { FirebaseApp } from "@angular/fire/app";

// App imports
import { FeedbackResponse } from "@legislative-tracker/shared/models";

@Injectable({ providedIn: "root" })
export class FeedbackService {
  private app = inject(FirebaseApp);

  async sendFeedback(title: string, body: string): Promise<FeedbackResponse> {
    const { getFunctions, httpsCallable } =
      await import("@angular/fire/functions");

    const functions = getFunctions(this.app);
    const submitIssue = httpsCallable(functions, "submitAnonymousIssue");

    const result = await submitIssue({ title, body });
    return result.data as FeedbackResponse;
  }
}
