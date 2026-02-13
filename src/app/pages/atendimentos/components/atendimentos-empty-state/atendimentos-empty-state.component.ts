import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-atendimentos-empty-state',
  standalone: true,
  templateUrl: './atendimentos-empty-state.component.html',
  styleUrls: ['./atendimentos-empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtendimentosEmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
}
