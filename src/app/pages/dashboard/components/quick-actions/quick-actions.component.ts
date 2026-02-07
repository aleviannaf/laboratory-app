import { Component, inject } from '@angular/core';
import { ActionCardComponent } from '../action-card/action-card.component';
import { Dialog } from '@angular/cdk/dialog';

import { PatientCreateDialogComponent } from '../../../../shared/ui/modal-patient/patient-create-dialog.component'
import { PatientCreateDialogResult } from '../../../../shared/ui/modal-patient/patient-create-dialog.types';

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
  private readonly dialog = inject(Dialog);
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

  onActionClick(action: QuickAction): void {
    if (action.title !== 'Criar Paciente') return;

    const ref = this.dialog.open<PatientCreateDialogResult>(PatientCreateDialogComponent, {
      // opcional: passar preset
      data: { preset: {} },
      // opcional: fechar ao clicar fora
      // disableClose: true,



      // 1) Classe do fundo escuro atrás do modal
      backdropClass: 'app-dialog-backdrop',

      // 2) Classe do “painel” do modal (a caixa que flutua)
      panelClass: 'app-dialog-panel',
    });

    ref.closed.subscribe((result) => {
      if (!result || result.type === 'cancel') return;

      // aqui você recebe os dados do form:
      console.log('payload', result.payload);

      // depois você chama seu service/repository para salvar etc.
    });
  }
}



