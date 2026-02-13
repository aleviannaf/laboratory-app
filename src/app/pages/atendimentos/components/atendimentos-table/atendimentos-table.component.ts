import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { AttendanceItem, AttendanceTab } from '../../models/attendance-queue.model';

@Component({
  selector: 'app-atendimentos-table',
  standalone: true,
  templateUrl: './atendimentos-table.component.html',
  styleUrls: ['./atendimentos-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtendimentosTableComponent {
  @Input({ required: true }) items!: readonly AttendanceItem[];
  @Input({ required: true }) tab!: AttendanceTab;
  @Output() readonly completeClick = new EventEmitter<string>();
  @Output() readonly viewClick = new EventEmitter<string>();

  onCompleteClick(id: string): void {
    this.completeClick.emit(id);
  }

  onViewClick(id: string): void {
    this.viewClick.emit(id);
  }

  urgencyLabel(item: AttendanceItem): string {
    switch (item.urgency) {
      case 'emergency':
        return 'EMERGENCIA';
      case 'urgent':
        return 'URGENTE';
      default:
        return 'NORMAL';
    }
  }

  statusLabel(item: AttendanceItem): string {
    return item.status === 'waiting' ? 'AGUARDANDO' : 'REALIZADO';
  }
}
