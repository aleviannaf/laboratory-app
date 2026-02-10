import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Patient } from './models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly mock: readonly Patient[] = [
    { id: '1', name: 'Glenda do Carmo Martins Freire', document: '123.456.789-00' },
    { id: '2', name: 'Danildo Mendes Gato', document: '987.654.321-11' },
    { id: '3', name: 'Willian Batista Guerreiro', document: '456.123.789-22' },
  ];

  listPatients(query?: string): Observable<readonly Patient[]> {
    const q = query?.trim().toLowerCase() ?? '';

    const filtered = q
      ? this.mock.filter((p) => {
          const name = p.name.toLowerCase();
          const doc = p.document.toLowerCase();
          return name.includes(q) || doc.includes(q);
        })
      : this.mock;

    return of(filtered).pipe(delay(400));
  }
}
