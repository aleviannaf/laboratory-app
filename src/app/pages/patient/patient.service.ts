import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { Patient } from './models/patient.model';
import { PatientView, PatientsApiService } from '../../core/services/patients-api.service';

@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private readonly patientsApi: PatientsApiService) {}

  listPatients(query?: string): Observable<readonly Patient[]> {
    return from(this.patientsApi.listPatients(query)).pipe(
      timeout(8000),
      map((items) => items.map(mapPatientViewToUiModel))
    );
  }
}

function mapPatientViewToUiModel(item: PatientView): Patient {
  return {
    id: item.id,
    name: item.full_name,
    document: item.cpf,
    fullName: item.full_name,
    cpf: item.cpf,
    birthDate: item.birth_date,
    sex: item.sex,
    phone: item.phone,
    address: item.address,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}
