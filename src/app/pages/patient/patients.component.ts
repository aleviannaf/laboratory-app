import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject,
  computed,
  DestroyRef,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Subject, of, EMPTY, from } from 'rxjs';
import {
  debounceTime,
  map,
  startWith,
  switchMap,
  catchError,
  finalize,
  filter,
  tap,
} from 'rxjs/operators';

import { PatientsHeaderComponent } from './components/patients-header/patients-header.component';
import { PatientsFiltersComponent } from './components/patients-filters/patients-filters.component';
import { PatientsTableComponent } from './components/patients-table/patients-table.component';

import { PatientService } from './patient.service';
import { Patient } from './models/patient.model';
import { PatientCreateDialogResult } from '../../shared/ui/modal-patient/patient-create-dialog.types';
import { PatientCreateDialogComponent } from '../../shared/ui/modal-patient/patient-create-dialog.component';
import {
  CreatePatientInput,
  PatientsApiService,
} from '../../core/services/patients-api.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { PatientRecordService } from './patient-record.service';
import {
  PatientRecordDialogComponent,
  PatientRecordDialogData,
} from './components/dialogs/patient-record-dialog/patient-record-dialog.component';

type SubmitPatientCreateDialogResult = Extract<
  PatientCreateDialogResult,
  { type: 'submit' }
>;

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [
    PatientsHeaderComponent,
    PatientsFiltersComponent,
    PatientsTableComponent,
  ],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsComponent implements OnInit {

  // dependencias
  private readonly patientService = inject(PatientService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly toast = inject(ToastService);
  private readonly patientRecordService = inject(PatientRecordService);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);

  // estado da tela
  readonly patients = signal<readonly Patient[]>([]);
  readonly loadingList = signal<boolean>(false);
  readonly loadingCreate = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly query = signal<string>(''); // filtro atual
  readonly loadedOnce = signal(false);


  // stream de busca (debounce + cancelamento)
  private readonly query$ = new Subject<string>();
  private readonly debounceMs = 300;

  // estados derivados
  readonly hasQuery = computed(() => this.query().trim().length > 0);
  readonly patientsCount = computed(() => this.patients().length);

  readonly showEmpty = computed(
  () =>
    this.loadedOnce() &&
    !this.loadingList() &&
    !this.error() &&
    this.patientsCount() === 0 &&
    !this.hasQuery()
);

  readonly showNoResult = computed(
    () =>
      this.loadedOnce() &&
      !this.loadingList() &&
      !this.error() &&
      this.patientsCount() === 0 &&
      this.hasQuery()
  );

  readonly showTable = computed(
    () => !this.loadingList() && !this.error() && this.patientsCount() > 0
  );

  ngOnInit(): void {
    this.query$
      .pipe(
        startWith(this.query()),
        map((q) => q.trim()),
        debounceTime(this.debounceMs),

        tap(() => {
          this.loadingList.set(true);
          this.error.set(null);
        }),

        switchMap((q) =>
          this.patientService.listPatients(q ? q : undefined).pipe(
            catchError((e) => {
              // log (opcional pra debug por enquanto, mas ideal: servico de log centralizado)
              console.error('listPatients error', e);
              this.error.set('Erro ao carregar pacientes.');
              return of([] as Patient[]);
            }),
            finalize(() => {
              this.loadingList.set(false);
              this.loadedOnce.set(true);
            })
          )
        ),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((patients) => this.patients.set(patients));

    this.refreshList();
  }

  private refreshList(): void {
    this.query$.next(this.query());
  }

  // handlers UI
  onFilterChange(query: string): void {
    this.query.set(query);
    this.query$.next(query);
  }

  onCreateClick(): void {
    const ref = this.dialog.open<PatientCreateDialogResult>(
      PatientCreateDialogComponent,
      {
        data: { preset: {} },
        backdropClass: 'app-dialog-backdrop',
        panelClass: 'app-dialog-panel',
      }
    );

    ref.closed
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(
          (result): result is SubmitPatientCreateDialogResult =>
            !!result && result.type === 'submit'
        ),
        switchMap((result) => {
          let input: CreatePatientInput;
          try {
            input = mapToCreateInput(result);
          } catch (e) {
            const msg = normalizeError(e);
            this.toast.error(msg);
            return EMPTY;
          }

          this.loadingCreate.set(true);
          this.error.set(null);

          // Tauri geralmente trabalha com Promise -> converte para Observable
          return from(this.patientsApi.createPatient(input)).pipe(
            catchError((e) => {
              const msg = mapCreatePatientError(normalizeError(e));
              this.toast.error(msg);
              console.error('createPatient error', e);
              return EMPTY;
            }),
            finalize(() => this.loadingCreate.set(false))
          );
        })
      )
      .subscribe({
        next: () => {
          this.error.set(null);
          this.toast.success('Paciente cadastrado com sucesso.');
          // recarrega lista mantendo o filtro atual
          this.refreshList();
        },
      });
  }

  onDetailsClick(patientId: string): void {
    const patient = this.patients().find((item) => item.id === patientId);
    if (!patient) {
      this.toast.error('Paciente nao encontrado.');
      return;
    }

    from(this.patientRecordService.getRecordByPatientId(patient.id))
      .pipe(
        catchError((error) => {
          const message = mapPatientRecordError(normalizeError(error));
          this.toast.error(message);
          console.error('getPatientRecord error', error);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((record) => {
        this.dialog.open<void, PatientRecordDialogData>(PatientRecordDialogComponent, {
          data: { record },
          backdropClass: 'app-dialog-backdrop',
          panelClass: 'app-dialog-panel',
        });
      });
  }
}

export function mapToCreateInput(
  result: SubmitPatientCreateDialogResult
): CreatePatientInput {
  const full_name = String(result.payload.fullName ?? '').trim();
  const cpf_input = String(result.payload.cpf ?? '').trim();
  const birth_date_input = String(result.payload.birthDate ?? '').trim();
  const phone = String(result.payload.phone ?? '').trim();
  const address = String(result.payload.address ?? '').trim();

  if (!full_name) throw new Error('Nome e obrigatorio.');

  const cpf = normalizeCpf(cpf_input);
  if (!cpf) throw new Error('CPF e obrigatorio.');
  if (cpf.length !== 11) throw new Error('CPF invalido. Use 11 digitos.');

  const birth_date = normalizeBirthDateToIso(birth_date_input);
  if (!birth_date) {
    throw new Error('Data de nascimento invalida. Use dd/mm/aaaa.');
  }

  if (!phone) throw new Error('Telefone e obrigatorio.');
  if (!address) throw new Error('Endereco e obrigatorio.');

  return {
    full_name,
    cpf,
    birth_date,
    sex: 'N/A',
    phone,
    address,
  };
}

function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizeBirthDateToIso(value: string): string | null {
  const raw = String(value ?? '').trim();

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return isValidDate(day, month, year) ? `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` : null;
  }

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const year = Number(brMatch[3]);

    if (!isValidDate(day, month, year)) {
      return null;
    }

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) {
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4));

    if (!isValidDate(day, month, year)) {
      return null;
    }

    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
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

function normalizeError(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as any).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return 'Erro inesperado.';
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

function mapPatientRecordError(rawMessage: string): string {
  const normalized = rawMessage.toLowerCase();
  if (normalized.includes('patient not found')) {
    return 'Paciente nao encontrado.';
  }
  return 'Nao foi possivel carregar o prontuario.';
}
