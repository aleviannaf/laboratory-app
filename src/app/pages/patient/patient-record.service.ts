import { Injectable } from '@angular/core';

import {
  CreateAttendanceInputDto,
  PatientRecordApiService,
  PatientRecordDto,
  PatientRecordEntryDto,
} from '../../core/services/patient-record-api.service';
import { CreateAttendancePayload } from './models/new-attendance.model';
import {
  PatientRecordEntry,
  PatientRecordExam,
  PatientRecordExamStatus,
  PatientRecordView,
} from './models/patient-record.model';

@Injectable({ providedIn: 'root' })
export class PatientRecordService {
  constructor(private readonly api: PatientRecordApiService) {}

  async getRecordByPatientId(patientId: string): Promise<PatientRecordView> {
    const dto = await this.api.getPatientRecord(patientId);
    return mapRecordDtoToView(dto);
  }

  async createAttendance(payload: CreateAttendancePayload): Promise<PatientRecordEntry> {
    if (payload.examIds.length === 0) {
      throw new Error('Selecione ao menos um exame.');
    }

    const catalog = await this.api.listExamCatalog();
    const catalogById = new Map(catalog.map((item) => [item.id, item]));

    const items = payload.examIds.map((examId) => {
      const exam = catalogById.get(examId);
      if (!exam) {
        throw new Error('Exame invalido para criacao do atendimento.');
      }

      return { name: exam.name };
    });

    const input: CreateAttendanceInputDto = {
      patient_id: payload.patientId,
      exam_date: payload.examDate,
      requester_id: payload.requesterId,
      items,
    };

    const created = await this.api.createAttendance(input);
    return mapEntryDtoToView(created);
  }
}

function mapRecordDtoToView(dto: PatientRecordDto): PatientRecordView {
  return {
    patient: {
      id: dto.patient.id,
      name: dto.patient.full_name,
      document: dto.patient.cpf,
      fullName: dto.patient.full_name,
      cpf: dto.patient.cpf,
      birthDate: dto.patient.birth_date,
      sex: dto.patient.sex,
      phone: dto.patient.phone,
      address: dto.patient.address,
      createdAt: dto.patient.created_at,
      updatedAt: dto.patient.updated_at,
    },
    email: buildEmail(dto.patient.full_name),
    entries: dto.entries.map(mapEntryDtoToView),
  };
}

function mapEntryDtoToView(dto: PatientRecordEntryDto): PatientRecordEntry {
  return {
    id: dto.exam_id,
    date: toBrazilianDate(dto.exam_date),
    exams: dto.items.map((item) => mapItemToExam(item, dto.status)),
  };
}

function mapItemToExam(
  item: PatientRecordEntryDto['items'][number],
  status: string
): PatientRecordExam {
  return {
    id: item.exam_item_id,
    name: item.name,
    protocol: item.exam_item_id.slice(0, 8).toUpperCase(),
    status: mapStatus(status),
    reportAvailable: item.report_available,
  };
}

function mapStatus(status: string): PatientRecordExamStatus {
  return status.toLowerCase() === 'completed' ? 'completed' : 'pending';
}

function toBrazilianDate(value: string): string {
  const raw = String(value ?? '').trim();

  // exam_date is a civil date (date-only). Avoid Date parsing with timezone.
  const isoDateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    return `${day}/${month}/${year}`;
  }

  const isoDateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoDateTime) {
    const [, year, month, day] = isoDateTime;
    return `${day}/${month}/${year}`;
  }

  return raw;
}

function buildEmail(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z.]/g, '');

  return normalized ? `${normalized}@email.com` : 'paciente@email.com';
}
