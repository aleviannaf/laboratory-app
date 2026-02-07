// patient-create-dialog.component.ts

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import {
  PatientCreateDialogData,
  PatientCreateDialogResult,
  PatientDraft,
} from './patient-create-dialog.types';

@Component({
  selector: 'app-patient-create-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-create-dialog.component.html',
  styleUrls: ['./patient-create-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientCreateDialogComponent {
  // DialogRef: controla o fechamento e devolve um resultado
  private readonly dialogRef = inject<DialogRef<PatientCreateDialogResult>>(DialogRef);

  // DIALOG_DATA: dados opcionais que quem abrir pode enviar (preset)
  private readonly data = inject<PatientCreateDialogData>(DIALOG_DATA, { optional: true }) ?? {};

  private readonly fb = inject(NonNullableFormBuilder);

  // Formulário tipado e non-nullable (melhor prática: evita `string | null`)
  readonly form = this.fb.group({
    fullName: [this.data.preset?.fullName ?? '', [Validators.required, Validators.minLength(2)]],
    cpf: [this.data.preset?.cpf ?? '', [Validators.required]],
    birthDate: [this.data.preset?.birthDate ?? '', [Validators.required]],
    phone: [this.data.preset?.phone ?? '', [Validators.required]],
    email: [this.data.preset?.email ?? '', [Validators.email]],
    address: [this.data.preset?.address ?? '', [Validators.required]],
  });

  close(): void {
    this.dialogRef.close({ type: 'cancel' });
  }

  submit(): void {
    if (this.form.invalid) return;

    const payload: PatientDraft = this.form.getRawValue();
    this.dialogRef.close({ type: 'submit', payload });
  }
}
