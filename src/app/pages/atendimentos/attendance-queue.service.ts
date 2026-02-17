import { Injectable } from '@angular/core';

import {
  AttendanceQueueItemDto,
  PatientRecordApiService,
} from '../../core/services/patient-record-api.service';
import {
  AttendanceItem,
  AttendanceTab,
  AttendanceTabCounts,
} from './models/attendance-queue.model';

@Injectable({ providedIn: 'root' })
export class AttendanceQueueService {
  constructor(private readonly api: PatientRecordApiService) {}

  async loadQueue(params: {
    date?: string;
    query?: string;
  }): Promise<readonly AttendanceItem[]> {
    const query = params.query?.trim() || undefined;

    const list = await this.api.listAttendanceQueue({
      date: params.date,
      query,
    });

    return list.map(mapQueueItemToModel);
  }

  async completeAttendance(id: string): Promise<AttendanceItem> {
    const updated = await this.api.completeAttendance({ attendance_id: id });
    return mapQueueItemToModel(updated);
  }

  filterByDate(items: readonly AttendanceItem[], dateIso: string): readonly AttendanceItem[] {
    return items.filter((item) => toDateOnly(item.scheduledAt) === dateIso);
  }

  filterByTab(items: readonly AttendanceItem[], tab: AttendanceTab): readonly AttendanceItem[] {
    const status = tab === 'scheduled' ? 'waiting' : 'done';
    return items.filter((item) => item.status === status);
  }

  filterByQuery(items: readonly AttendanceItem[], query: string): readonly AttendanceItem[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) => {
      const examText = item.exams.join(' ').toLowerCase();
      const text = `${item.patientName} ${item.protocol} ${examText}`.toLowerCase();
      return text.includes(normalized);
    });
  }

  countByTab(items: readonly AttendanceItem[], dateIso: string): AttendanceTabCounts {
    const inDate = this.filterByDate(items, dateIso);
    return {
      scheduled: inDate.filter((item) => item.status === 'waiting').length,
      completed: inDate.filter((item) => item.status === 'done').length,
    };
  }

  findById(items: readonly AttendanceItem[], id: string): AttendanceItem | undefined {
    return items.find((item) => item.id === id);
  }
}

function mapQueueItemToModel(item: AttendanceQueueItemDto): AttendanceItem {
  return {
    id: item.attendance_id,
    patientName: item.patient_name,
    protocol: item.attendance_id,
    exams: item.exam_names,
    urgency: 'normal',
    status: item.status === 'completed' ? 'done' : 'waiting',
    scheduledAt: ensureDateTime(item.exam_date),
    completedAt: item.status === 'completed' ? item.updated_at : undefined,
  };
}

function ensureDateTime(dateOrDateTime: string): string {
  const value = String(dateOrDateTime ?? '').trim();
  if (!value) {
    return value;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00`;
  }
  return value;
}

function toDateOnly(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}
