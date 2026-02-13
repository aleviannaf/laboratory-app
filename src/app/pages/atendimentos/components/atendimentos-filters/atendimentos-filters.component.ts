import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-atendimentos-filters',
  standalone: true,
  templateUrl: './atendimentos-filters.component.html',
  styleUrls: ['./atendimentos-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtendimentosFiltersComponent {
  @Input({ required: true }) query!: string;
  @Output() readonly queryChange = new EventEmitter<string>();
  @Output() readonly otherDatesClick = new EventEmitter<void>();

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.queryChange.emit(value);
  }

  onOtherDatesClick(): void {
    this.otherDatesClick.emit();
  }
}
