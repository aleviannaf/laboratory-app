import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

export interface CreateAttendanceItemInputDto {
  name: string;
  unit?: string;
  method?: string;
  reference_range?: string;
}

export interface CreateAttendanceInputDto {
  patient_id: string;
  exam_date: string;
  requester_id?: string;
  status?: string;
  procedure_type?: string;
  delivered_to?: string;
  notes?: string;
  items: CreateAttendanceItemInputDto[];
}

export interface ExamCatalogItemDto {
  id: string;
  name: string;
  category_id: string;
  category_title: string;
  price_cents: number;
}

export interface PatientRecordExamItemDto {
  exam_item_id: string;
  name: string;
  unit?: string;
  method?: string;
  reference_range?: string;
  result_value?: string;
  result_flag?: string;
  report_available: boolean;
}

export interface PatientRecordEntryDto {
  exam_id: string;
  exam_date: string;
  status: string;
  requester_name?: string;
  items: PatientRecordExamItemDto[];
}

export interface PatientRecordDto {
  patient: {
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
  entries: PatientRecordEntryDto[];
}

export interface AttendanceQueueItemDto {
  attendance_id: string;
  patient_id: string;
  patient_name: string;
  patient_cpf: string;
  exam_date: string;
  status: string;
  exam_names: string[];
  updated_at: string;
}

export interface CompleteAttendanceInputDto {
  attendance_id: string;
}

@Injectable({ providedIn: 'root' })
export class PatientRecordApiService {
  getPatientRecord(patientId: string): Promise<PatientRecordDto> {
    return invoke<PatientRecordDto>('get_patient_record', { patientId });
  }

  listExamCatalog(): Promise<ExamCatalogItemDto[]> {
    return invoke<ExamCatalogItemDto[]>('list_exam_catalog');
  }

  createAttendance(input: CreateAttendanceInputDto): Promise<PatientRecordEntryDto> {
    return invoke<PatientRecordEntryDto>('create_attendance', { input });
  }

  listAttendanceQueue(params?: {
    date?: string;
    status?: 'waiting' | 'completed';
    query?: string;
  }): Promise<AttendanceQueueItemDto[]> {
    return invoke<AttendanceQueueItemDto[]>('list_attendance_queue', {
      date: params?.date,
      status: params?.status,
      query: params?.query,
    });
  }

  completeAttendance(input: CompleteAttendanceInputDto): Promise<AttendanceQueueItemDto> {
    return invoke<AttendanceQueueItemDto>('complete_attendance', { input });
  }
}
