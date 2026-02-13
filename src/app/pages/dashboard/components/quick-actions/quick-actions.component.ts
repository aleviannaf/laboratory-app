import { Component, inject } from '@angular/core';
import { ActionCardComponent } from '../action-card/action-card.component';
import { Dialog } from '@angular/cdk/dialog';

import { PatientsApiService, CreatePatientInput } from '../../../../core/services/patients-api.service';

import { PatientCreateDialogComponent } from '../../../../shared/ui/modal-patient/patient-create-dialog.component'
import { PatientCreateDialogResult } from '../../../../shared/ui/modal-patient/patient-create-dialog.types';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

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
  private readonly patientsApi = inject(PatientsApiService);
  private readonly toast = inject(ToastService);

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
      data: { preset: {} },
      backdropClass: 'app-dialog-backdrop',
      panelClass: 'app-dialog-panel',
    });

    ref.closed.subscribe(async (result) => {
      if (!result || result.type === 'cancel') return;

      // depois chamar service/repository para salvar etc.
      try {
          const input: CreatePatientInput = {
          full_name: result.payload.fullName,
          cpf: result.payload.cpf,
          birth_date: result.payload.birthDate,
          sex: 'N/A',          // 🔧 TEMPORÁRIO – só para teste
          phone: result.payload.phone,
          address: result.payload.address,
        };

        const created = await this.patientsApi.createPatient(input);

        console.log('Paciente criado:', created);
        this.toast.success('Paciente cadastrado com sucesso.');

        // aqui você pode:
        // - emitir evento para atualizar lista
        // - mostrar toast/snackbar
        // - navegar para tela do paciente
      }catch (e: any) {
        // No Rust (Step 10) seu command está retornando erro como String (Debug do AppError)
        const rawMsg = typeof e === 'string' ? e : (e?.message ?? 'Erro inesperado ao criar paciente');
        const msg = mapCreatePatientError(rawMsg);
        console.error(msg, e);
        this.toast.error(msg)
      }
    });


    
  }
}






function mapCreatePatientError(rawMessage: string): string {
  const normalized = rawMessage.toLowerCase();
  if (
    normalized.includes('conflict while saving patient') ||
    normalized.includes('unique constraint failed')
  ) {
    return 'CPF ja cadastrado.';
  }
  if (normalized.includes('cpf is required')) {
    return 'CPF e obrigatorio.';
  }
  return rawMessage;
}

