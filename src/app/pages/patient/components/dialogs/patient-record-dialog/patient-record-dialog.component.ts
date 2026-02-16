import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRecordView } from '../../../models/patient-record.model';
import {
  NewAttendanceDialogComponent,
  NewAttendanceDialogData,
  NewAttendanceDialogResult,
} from '../new-attendance-dialog/new-attendance-dialog.component';
import { PatientRecordService } from '../../../patient-record.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

export interface PatientRecordDialogData {
  record: PatientRecordView;
}

@Component({
  selector: 'app-patient-record-dialog',
  standalone: true,
  templateUrl: './patient-record-dialog.component.html',
  styleUrls: ['./patient-record-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientRecordDialogComponent {
  private readonly dialogRef = inject(DialogRef<void>);
  private readonly dialog = inject(Dialog);
  private readonly patientRecordService = inject(PatientRecordService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<PatientRecordDialogData>(DIALOG_DATA);
  readonly record = signal(this.data.record);

  constructor() {
    void this.reloadRecord();
  }

  close(): void {
    this.dialogRef.close();
  }

  onNewAttendanceClick(): void {
    const ref = this.dialog.open<NewAttendanceDialogResult | void, NewAttendanceDialogData>(
      NewAttendanceDialogComponent,
      {
        data: {
          patientId: this.record().patient.id,
          patientName: this.record().patient.fullName,
        },
        backdropClass: 'app-dialog-backdrop',
        panelClass: 'app-dialog-panel',
      }
    );

    ref.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result?.created) {
        void this.reloadRecord();
      }
    });
  }

  private async reloadRecord(): Promise<void> {
    try {
      const refreshed = await this.patientRecordService.getRecordByPatientId(this.record().patient.id);
      this.record.set(refreshed);
    } catch (error) {
      this.toast.error(normalizeError(error));
    }
  }
}

function normalizeError(error: unknown): string {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return 'Nao foi possivel carregar o prontuario.';
}
