import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface ConfirmCompleteDialogData {
  patientName: string;
  protocol: string;
}

@Component({
  selector: 'app-confirm-complete-dialog',
  standalone: true,
  templateUrl: './confirm-complete-dialog.component.html',
  styleUrls: ['./confirm-complete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmCompleteDialogComponent {
  private readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<ConfirmCompleteDialogData>(DIALOG_DATA);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
