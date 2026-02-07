import { Component, Input, EventEmitter,  Output  } from '@angular/core';

@Component({
  selector: 'app-action-card',
  standalone: true,
  templateUrl: './action-card.component.html',
  styleUrl: './action-card.component.scss',
})
export class ActionCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input({ required: true }) icon!: string;

  @Input() variant: 'primary' | 'default' = 'default';

  @Output() actionClick = new EventEmitter<void>();

  onClick(): void {
    this.actionClick.emit();
  }
}
