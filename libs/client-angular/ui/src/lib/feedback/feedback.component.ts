import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

// App Imports
import { LinkSnackBar } from '../snackbars/link-snackbar/link-snackbar.component';
import { FeedbackService } from '@legislative-tracker/client-angular/core';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./feedback.component.scss'],
})
export class Feedback {
  private fb = inject(FormBuilder);
  private feedbackService = inject(FeedbackService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router); // Inject Router
  private dialogRef = inject(MatDialogRef<Feedback>);

  // UI State Signals
  isSubmitting = signal(false);

  // Form Definition
  form: FormGroup = this.fb.group({
    type: ['bug', Validators.required],
    title: ['', [Validators.required, Validators.minLength(4)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  // Issue Types for the Dropdown
  issueTypes = [
    { value: 'bug', label: 'Bug Report', icon: 'bug_report' },
    { value: 'feature', label: 'Feature Request', icon: 'lightbulb' },
    { value: 'general', label: 'General Feedback', icon: 'feedback' },
  ];

  async onSubmit() {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const { type, title, description } = this.form.value;

    // Capture the current URL
    const currentUrl = this.router.url;

    // Format the body to include the type for the GitHub Issue
    const formattedBody = `**Type:** ${type.toUpperCase()}\n**Context:** \`${currentUrl}\`\n\n${description}`;

    try {
      const response = await this.feedbackService.sendFeedback(
        title,
        formattedBody,
        type,
      );

      this.snackBar.openFromComponent(LinkSnackBar, {
        duration: 8000, // Give them time to click
        data: {
          message: `Issue #${response.issueNumber} successfully submitted.`,
          linkText: 'View on GitHub',
          linkUrl: response.issueUrl,
        },
      });

      this.dialogRef.close();

      this.form.reset({ type: 'bug' });
      // Reset validation errors visually
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.setErrors(null);
      });
    } catch (error) {
      console.error('Feedback failed', error);
      this.snackBar.open(
        'Failed to submit feedback. Please try again.',
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        },
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
  close() {
    this.dialogRef.close();
  }
}
