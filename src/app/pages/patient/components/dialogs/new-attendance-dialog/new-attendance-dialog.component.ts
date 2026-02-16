import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { NewAttendanceCatalogService } from '../../../new-attendance-catalog.service';
import {
  NewAttendanceCatalogItem,
  NewAttendanceCatalogSection,
} from '../../../models/new-attendance.model';
import { PatientRecordService } from '../../../patient-record.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

export interface NewAttendanceDialogData {
  patientId: string;
  patientName: string;
}

export interface NewAttendanceDialogResult {
  created: true;
}

@Component({
  selector: 'app-new-attendance-dialog',
  standalone: true,
  templateUrl: './new-attendance-dialog.component.html',
  styleUrls: ['./new-attendance-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewAttendanceDialogComponent {
  private readonly dialogRef = inject(DialogRef<NewAttendanceDialogResult | void>);
  private readonly catalogService = inject(NewAttendanceCatalogService);
  private readonly patientRecordService = inject(PatientRecordService);
  private readonly toast = inject(ToastService);
  readonly data = inject<NewAttendanceDialogData>(DIALOG_DATA);

  readonly query = signal('');
  readonly selectedDate = signal(formatDateInput(new Date()));
  readonly selectedExamIds = signal<readonly string[]>([]);
  readonly catalogSections = signal<readonly NewAttendanceCatalogSection[]>([]);
  readonly loadingCatalog = signal<boolean>(true);
  readonly saving = signal<boolean>(false);

  readonly selectedExams = computed(() =>
    this.selectedExamIds()
      .map((id) => this.catalogService.findById(id))
      .filter((item): item is NewAttendanceCatalogItem => !!item)
  );

  readonly total = computed(() => this.selectedExams().reduce((sum, item) => sum + item.price, 0));

  private searchRequestVersion = 0;

  constructor() {
    void this.reloadCatalog();
  }

  setQuery(value: string): void {
    this.query.set(value);
    void this.reloadCatalog();
  }

  isSelected(id: string): boolean {
    return this.selectedExamIds().includes(id);
  }

  toggleExam(id: string): void {
    const current = this.selectedExamIds();
    if (current.includes(id)) {
      this.selectedExamIds.set(current.filter((itemId) => itemId !== id));
      return;
    }
    this.selectedExamIds.set([...current, id]);
  }

  removeExam(id: string): void {
    this.selectedExamIds.set(this.selectedExamIds().filter((itemId) => itemId !== id));
  }

  setToday(): void {
    this.selectedDate.set(formatDateInput(new Date()));
  }

  setDate(value: string): void {
    this.selectedDate.set(value);
  }

  close(): void {
    this.dialogRef.close();
  }

  async confirm(): Promise<void> {
    if (this.selectedExamIds().length === 0 || this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      await this.patientRecordService.createAttendance({
        patientId: this.data.patientId,
        examDate: this.selectedDate(),
        examIds: this.selectedExamIds(),
      });
      this.dialogRef.close({ created: true });
    } catch (error) {
      this.toast.error(normalizeError(error));
    } finally {
      this.saving.set(false);
    }
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private async reloadCatalog(): Promise<void> {
    const requestVersion = this.searchRequestVersion + 1;
    this.searchRequestVersion = requestVersion;
    this.loadingCatalog.set(true);

    try {
      const sections = await this.catalogService.list(this.query());
      if (requestVersion !== this.searchRequestVersion) {
        return;
      }
      this.catalogSections.set(sections);
    } catch (error) {
      if (requestVersion !== this.searchRequestVersion) {
        return;
      }
      this.catalogSections.set([]);
      this.toast.error(normalizeError(error));
    } finally {
      if (requestVersion === this.searchRequestVersion) {
        this.loadingCatalog.set(false);
      }
    }
  }
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  return 'Nao foi possivel concluir a operacao.';
}
