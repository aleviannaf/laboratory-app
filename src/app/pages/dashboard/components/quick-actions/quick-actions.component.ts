import { Component } from '@angular/core';
import { ActionCardComponent } from '../action-card/action-card.component';

type QuickAction = {
  title: string;
  description: string;
  icon: string;
  variant?: 'primary' | 'default';
};

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [ActionCardComponent],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
})
export class QuickActionsComponent {
  actions: QuickAction[] = [
    {
      title: 'Criar Paciente',
      description: 'Novo cadastro e prontuário.',
      icon: '👤',
      variant: 'primary',
    },
    {
      title: 'Buscar Paciente',
      description: 'Localizar fichas ativas.',
      icon: '🔎',
      variant: 'default',
    },
    {
      title: 'Buscar Exame',
      description: 'Resultados e laudos.',
      icon: '📄',
      variant: 'default',
    },
  ];
}
