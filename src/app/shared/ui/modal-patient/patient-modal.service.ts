import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Observable } from 'rxjs';

import { PatientCreateDialogComponent } from './patient-create-dialog.component';
import {
  PatientCreateDialogData,
  PatientCreateDialogResult,
  PatientDraft,
} from './patient-create-dialog.types';

@Injectable({ providedIn: 'root' })
export class PatientModalService {
  private readonly dialog = inject(Dialog);

  openCreate(preset?: Partial<PatientDraft>): Observable<PatientCreateDialogResult | undefined> {
    const ref = this.dialog.open<PatientCreateDialogResult, PatientCreateDialogData>(
      PatientCreateDialogComponent,
      {
        data: { preset },
        // opcional: se quiser impedir fechar clicando fora
        // disableClose: true,
      }
    );

    return ref.closed; // <- tipado e não vira unknown
  }
}
