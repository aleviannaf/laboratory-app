import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-create-attendance-placeholder-dialog',
  standalone: true,
  templateUrl: './create-attendance-placeholder-dialog.component.html',
  styleUrls: ['./create-attendance-placeholder-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAttendancePlaceholderDialogComponent {
  private readonly dialogRef = inject(DialogRef<void>);

  close(): void {
    this.dialogRef.close();
  }
}
