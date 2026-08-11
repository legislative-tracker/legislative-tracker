import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Feedback } from "@legislative-tracker/client-angular/ui";

@Injectable({ providedIn: "root" })
export class UiService {
  private dialog = inject(MatDialog);

  openFeedbackDialog() {
    this.dialog.open(Feedback, {
      width: "500px",
      maxWidth: "90vw",
      disableClose: true,
      autoFocus: false,
    });
  }
}
