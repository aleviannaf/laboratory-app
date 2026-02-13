import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-exames-empty-state',
  standalone: true,
  templateUrl: './exames-empty-state.component.html',
  styleUrls: ['./exames-empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamesEmptyStateComponent {}
