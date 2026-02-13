import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { AttendanceItem } from '../../../models/attendance-queue.model';

export interface AttendanceDetailsDialogData {
  item: AttendanceItem;
}

@Component({
  selector: 'app-attendance-details-dialog',
  standalone: true,
  templateUrl: './attendance-details-dialog.component.html',
  styleUrls: ['./attendance-details-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceDetailsDialogComponent {
  private readonly dialogRef = inject(DialogRef<void>);
  readonly data = inject<AttendanceDetailsDialogData>(DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
