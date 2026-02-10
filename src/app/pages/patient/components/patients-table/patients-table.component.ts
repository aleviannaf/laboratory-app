import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { Patient } from '../../models/patient.model';

@Component({
  selector: 'app-patients-table',
  standalone: true,
  templateUrl: './patients-table.component.html',
  styleUrls: ['./patients-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsTableComponent {
  @Input({ required: true }) patients!: readonly Patient[];
  @Output() readonly detailsClick = new EventEmitter<string>();

  onDetailsClick(id: string): void {
    this.detailsClick.emit(id);
  }
}
