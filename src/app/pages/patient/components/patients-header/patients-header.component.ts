import { Component, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-patients-header',
  standalone: true,
  templateUrl: './patients-header.component.html',
  styleUrls: ['./patients-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsHeaderComponent {
  @Output() readonly createClick = new EventEmitter<void>();

  onCreateClick(): void {
    this.createClick.emit();
  }
}
