import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
  private readonly dialogRef = inject<DialogRef<PatientCreateDialogResult>>(DialogRef);
  private readonly data = inject<PatientCreateDialogData>(DIALOG_DATA, { optional: true }) ?? {};
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    fullName: [this.data.preset?.fullName ?? '', [Validators.required, Validators.minLength(2)]],
    cpf: [
      formatCpf(this.data.preset?.cpf ?? ''),
      [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)],
    ],
    birthDate: [
      formatBirthDate(this.data.preset?.birthDate ?? ''),
      [
        Validators.required,
        Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/),
        validBrazilianDateValidator(),
      ],
    ],
    phone: [this.data.preset?.phone ?? '', [Validators.required]],
    email: [this.data.preset?.email ?? '', [Validators.email]],
    address: [this.data.preset?.address ?? '', [Validators.required]],
  });

  onCpfInput(): void {
    const control = this.form.controls.cpf;
    const masked = formatCpf(control.value);
    if (masked !== control.value) {
      control.setValue(masked, { emitEvent: false });
    }
  }

  onBirthDateInput(): void {
    const control = this.form.controls.birthDate;
    const masked = formatBirthDate(control.value);
    if (masked !== control.value) {
      control.setValue(masked, { emitEvent: false });
    }
  }

  close(): void {
    this.dialogRef.close({ type: 'cancel' });
  }

  submit(): void {
    this.onCpfInput();
    this.onBirthDateInput();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: PatientDraft = this.form.getRawValue();
    this.dialogRef.close({ type: 'submit', payload });
  }
}

function onlyDigits(value: string): string {
  return String(value ?? '').replace(/\D/g, '');
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatBirthDate(value: string): string {
  const raw = String(value ?? '').trim();

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${day}/${month}/${year}`;
  }

  const digits = onlyDigits(raw).slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function validBrazilianDateValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (!isValidDate(day, month, year)) {
      return { invalidDate: true };
    }

    return null;
  };
}

function isValidDate(day: number, month: number, year: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return false;
  }

  if (year < 1900 || year > 2100) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
