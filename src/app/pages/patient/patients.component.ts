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
  distinctUntilChanged,
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
        distinctUntilChanged(),

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
          (result): result is PatientCreateDialogResult =>
            !!result && result.type !== 'cancel'
        ),
        switchMap((result) => {
          let input: CreatePatientInput;
          try {
            input = mapToCreateInput(result);
          } catch (e) {
            const msg = normalizeError(e);
            this.error.set(msg);
            return EMPTY;
          }

          this.loadingCreate.set(true);
          this.error.set(null);

          // Tauri geralmente trabalha com Promise -> converte para Observable
          return from(this.patientsApi.createPatient(input)).pipe(
            catchError((e) => {
              const msg = normalizeError(e);
              this.error.set(msg);
              console.error('createPatient error', e);
              return EMPTY;
            }),
            finalize(() => this.loadingCreate.set(false))
          );
        })
      )
      .subscribe({
        next: () => {
          // recarrega lista mantendo o filtro atual
          this.refreshList();
        },
      });
  }

  onDetailsClick(patientId: string): void {
    void patientId;
  }
}


function mapToCreateInput(payload: any): CreatePatientInput {
  const full_name = String(payload?.fullName ?? '').trim();
  if (!full_name) throw new Error('Nome é obrigatório.');

 
  const birth_date = payload?.birthDate ?? null;

  return {
    full_name,
    birth_date,
    // ⚠️tornar obrigatório no modal .
    sex: payload?.sex ?? 'N/A',
    phone: payload?.phone ?? null,
    address: payload?.address ?? null,
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
