import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface DateFilterDialogData {
  selectedDate: string;
}

@Component({
  selector: 'app-date-filter-dialog',
  standalone: true,
  templateUrl: './date-filter-dialog.component.html',
  styleUrls: ['./date-filter-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateFilterDialogComponent {
  private readonly dialogRef = inject(DialogRef<string | undefined>);
  private readonly data = inject<DateFilterDialogData>(DIALOG_DATA);
  readonly date = signal(this.data.selectedDate);

  onInput(event: Event): void {
    this.date.set((event.target as HTMLInputElement).value);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  apply(): void {
    this.dialogRef.close(this.date());
  }
}
