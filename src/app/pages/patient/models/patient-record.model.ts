import { Patient } from './patient.model';

export type PatientRecordExamStatus = 'pending' | 'completed';

export interface PatientRecordExam {
  id: string;
  name: string;
  protocol: string;
  status: PatientRecordExamStatus;
  reportAvailable: boolean;
}

export interface PatientRecordEntry {
  id: string;
  date: string;
  exams: readonly PatientRecordExam[];
}

export interface PatientRecordView {
  patient: Patient;
  email: string;
  entries: readonly PatientRecordEntry[];
}
