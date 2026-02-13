import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

export type CreatePatientInput = {
  full_name: string;
  cpf: string;
  birth_date: string;
  sex: string;
  phone: string;
  address: string;
};

export type PatientView = {
  id: string;
  full_name: string;
  cpf: string;
  birth_date: string;
  sex: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
};

@Injectable({ providedIn: 'root' })
export class PatientsApiService {
  createPatient(input: CreatePatientInput): Promise<PatientView> {
    // o nome do command deve bater com o #[tauri::command] fn create_patient
    return invoke<PatientView>('create_patient', { input });
  }

  listPatients(query?: string): Promise<PatientView[]> {
    const normalized = query?.trim();
    if (normalized) {
      return invoke<PatientView[]>('list_patients', { query: normalized });
    }
    return invoke<PatientView[]>('list_patients');
  }
}
