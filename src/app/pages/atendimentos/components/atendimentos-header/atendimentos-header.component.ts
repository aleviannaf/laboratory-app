import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { AttendanceTab } from '../../models/attendance-queue.model';

@Component({
  selector: 'app-atendimentos-header',
  standalone: true,
  templateUrl: './atendimentos-header.component.html',
  styleUrls: ['./atendimentos-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtendimentosHeaderComponent {
  @Input({ required: true }) selectedTab!: AttendanceTab;
  @Input({ required: true }) selectedDateLabel!: string;
  @Input({ required: true }) scheduledCount!: number;
  @Input({ required: true }) completedCount!: number;
  @Output() readonly tabChange = new EventEmitter<AttendanceTab>();

  onTabClick(tab: AttendanceTab): void {
    this.tabChange.emit(tab);
  }
}
