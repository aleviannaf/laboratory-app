import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-exames-filters',
  standalone: true,
  templateUrl: './exames-filters.component.html',
  styleUrls: ['./exames-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamesFiltersComponent {
  @Input({ required: true }) query!: string;
  @Output() readonly filterChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterChange.emit(value);
  }
}
