import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

import { AttendanceQueueService } from './attendance-queue.service';
import { AttendanceItem, AttendanceTab } from './models/attendance-queue.model';
import { AtendimentosHeaderComponent } from './components/atendimentos-header/atendimentos-header.component';
import { AtendimentosFiltersComponent } from './components/atendimentos-filters/atendimentos-filters.component';
import { AtendimentosTableComponent } from './components/atendimentos-table/atendimentos-table.component';
import { AtendimentosEmptyStateComponent } from './components/atendimentos-empty-state/atendimentos-empty-state.component';
import {
  ConfirmCompleteDialogComponent,
  ConfirmCompleteDialogData,
} from './components/dialogs/confirm-complete-dialog/confirm-complete-dialog.component';
import {
  AttendanceDetailsDialogComponent,
  AttendanceDetailsDialogData,
} from './components/dialogs/attendance-details-dialog/attendance-details-dialog.component';
import { CreateAttendancePlaceholderDialogComponent } from './components/dialogs/create-attendance-placeholder-dialog/create-attendance-placeholder-dialog.component';
import {
  DateFilterDialogComponent,
  DateFilterDialogData,
} from './components/dialogs/date-filter-dialog/date-filter-dialog.component';

@Component({
  selector: 'app-atendimentos',
  standalone: true,
  imports: [
    AtendimentosHeaderComponent,
    AtendimentosFiltersComponent,
    AtendimentosTableComponent,
    AtendimentosEmptyStateComponent,
  ],
  templateUrl: './atendimentos.component.html',
  styleUrl: './atendimentos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtendimentosComponent {
  private readonly queueService = inject(AttendanceQueueService);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<readonly AttendanceItem[]>(this.queueService.getSeed());
  readonly selectedTab = signal<AttendanceTab>('scheduled');
  readonly query = signal('');
  readonly selectedDate = signal(toIsoDate(new Date()));

  readonly selectedDateLabel = computed(() => formatDateLabel(this.selectedDate()));
  readonly counts = computed(() =>
    this.queueService.countByTab(this.items(), this.selectedDate())
  );

  readonly dateItems = computed(() =>
    this.queueService.filterByDate(this.items(), this.selectedDate())
  );
  readonly tabItems = computed(() =>
    this.queueService.filterByTab(this.dateItems(), this.selectedTab())
  );
  readonly filteredItems = computed(() =>
    this.queueService.filterByQuery(this.tabItems(), this.query())
  );

  readonly emptyTitle = computed(() =>
    this.query().trim()
      ? 'Nenhum atendimento encontrado.'
      : this.selectedTab() === 'scheduled'
      ? 'Nenhum atendimento agendado.'
      : 'Nenhum atendimento concluido.'
  );

  readonly emptySubtitle = computed(() =>
    this.query().trim()
      ? 'Tente ajustar a busca por paciente, protocolo ou exame.'
      : 'Selecione outra data para visualizar mais resultados.'
  );

  onTabChange(tab: AttendanceTab): void {
    this.selectedTab.set(tab);
  }

  onQueryChange(query: string): void {
    this.query.set(query);
  }

  onOtherDatesClick(): void {
    const ref = this.dialog.open<string | undefined, DateFilterDialogData>(
      DateFilterDialogComponent,
      {
        data: { selectedDate: this.selectedDate() },
        backdropClass: 'app-dialog-backdrop',
        panelClass: 'app-dialog-panel',
      }
    );

    ref.closed
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((date): date is string => !!date)
      )
      .subscribe((date) => this.selectedDate.set(date));
  }

  onCompleteClick(id: string): void {
    const item = this.queueService.findById(this.items(), id);
    if (!item) return;

    const ref = this.dialog.open<boolean, ConfirmCompleteDialogData>(
      ConfirmCompleteDialogComponent,
      {
        data: { patientName: item.patientName, protocol: item.protocol },
        backdropClass: 'app-dialog-backdrop',
        panelClass: 'app-dialog-panel',
      }
    );

    ref.closed
      .pipe(takeUntilDestroyed(this.destroyRef), filter((confirmed) => !!confirmed))
      .subscribe(() => {
        const now = new Date().toISOString().slice(0, 19);
        this.items.set(this.queueService.markAsDone(this.items(), id, now));
      });
  }

  onViewClick(id: string): void {
    const item = this.queueService.findById(this.items(), id);
    if (!item) return;

    this.dialog.open<void, AttendanceDetailsDialogData>(AttendanceDetailsDialogComponent, {
      data: { item },
      backdropClass: 'app-dialog-backdrop',
      panelClass: 'app-dialog-panel',
    });
  }

  onFabClick(): void {
    this.dialog.open(CreateAttendancePlaceholderDialogComponent, {
      backdropClass: 'app-dialog-backdrop',
      panelClass: 'app-dialog-panel',
    });
  }
}

function formatDateLabel(dateIso: string): string {
  const [year, month, day] = dateIso.split('-');
  return `${day}/${month}/${year}`;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
