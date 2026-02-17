import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
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
export class AtendimentosComponent implements OnInit {
  private readonly queueService = inject(AttendanceQueueService);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<readonly AttendanceItem[]>([]);
  readonly selectedTab = signal<AttendanceTab>('scheduled');
  readonly query = signal('');
  readonly selectedDate = signal(toIsoDate(new Date()));
  readonly loading = signal(false);
  readonly loadedOnce = signal(false);
  readonly error = signal<string | null>(null);

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

  readonly emptyTitle = computed(() => {
    if (this.loading()) return 'Carregando atendimentos...';
    if (this.error()) return 'Nao foi possivel carregar atendimentos.';
    if (this.query().trim()) return 'Nenhum atendimento encontrado.';
    return this.selectedTab() === 'scheduled'
      ? 'Nenhum atendimento agendado.'
      : 'Nenhum atendimento concluido.';
  });

  readonly emptySubtitle = computed(() => {
    if (this.error()) return this.error() ?? 'Erro inesperado.';
    if (this.query().trim()) return 'Tente ajustar a busca por paciente, protocolo ou exame.';
    return 'Selecione outra data para visualizar mais resultados.';
  });

  ngOnInit(): void {
    void this.reloadQueue();
  }

  onTabChange(tab: AttendanceTab): void {
    this.selectedTab.set(tab);
  }

  async onQueryChange(query: string): Promise<void> {
    this.query.set(query);
    await this.reloadQueue();
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
      .subscribe((date) => {
        this.selectedDate.set(date);
        void this.reloadQueue();
      });
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
        void this.completeAttendance(id);
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

  private async reloadQueue(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const items = await this.queueService.loadQueue({
        date: this.selectedDate(),
        query: this.query(),
      });
      this.items.set(items);
    } catch (error) {
      this.error.set(normalizeError(error));
      this.items.set([]);
    } finally {
      this.loading.set(false);
      this.loadedOnce.set(true);
    }
  }

  private async completeAttendance(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.queueService.completeAttendance(id);
      await this.reloadQueue();
    } catch (error) {
      this.error.set(normalizeError(error));
    } finally {
      this.loading.set(false);
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
  return 'Erro ao carregar atendimentos.';
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
