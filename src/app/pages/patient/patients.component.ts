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

  // dependências
  private readonly patientService = inject(PatientService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly toast = inject(ToastService);
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
              // log (opcional pra debug por enquanto, mas ideal: serviço de log centralizado)
              console.error('listPatients error', e);
              this.error.set('Erro ao carregar pacientes.');
              return of([] as Patient[]);
            }),
            finalize(() => {
              this.loadingList.set(false)
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
    void patientId;
  }
}


export function mapToCreateInput(
  result: SubmitPatientCreateDialogResult
): CreatePatientInput {
  const full_name = String(result.payload.fullName ?? '').trim();
  const cpf = String(result.payload.cpf ?? '').trim();
  const birth_date = String(result.payload.birthDate ?? '').trim();
  const phone = String(result.payload.phone ?? '').trim();
  const address = String(result.payload.address ?? '').trim();

  if (!full_name) throw new Error('Nome e obrigatorio.');
  if (!cpf) throw new Error('CPF e obrigatorio.');
  if (!birth_date) throw new Error('Nascimento e obrigatorio.');
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
