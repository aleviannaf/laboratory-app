import { Component, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-patients-filters',
  standalone: true,
  templateUrl: './patients-filters.component.html',
  styleUrls: ['./patients-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsFiltersComponent {
  @Output() readonly filterChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterChange.emit(value);
  }
}
