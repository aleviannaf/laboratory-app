import { Injectable } from '@angular/core';

import {
  AttendanceItem,
  AttendanceTab,
  AttendanceTabCounts,
} from './models/attendance-queue.model';

@Injectable({ providedIn: 'root' })
export class AttendanceQueueService {
  private readonly seed: readonly AttendanceItem[] = buildSeed();

  getSeed(): readonly AttendanceItem[] {
    return this.seed;
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

  markAsDone(
    items: readonly AttendanceItem[],
    id: string,
    whenIso: string
  ): readonly AttendanceItem[] {
    return items.map((item) => {
      if (item.id !== id || item.status === 'done') return item;
      return {
        ...item,
        status: 'done',
        completedAt: whenIso,
      };
    });
  }

  findById(items: readonly AttendanceItem[], id: string): AttendanceItem | undefined {
    return items.find((item) => item.id === id);
  }
}

function toDateOnly(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

function buildSeed(): readonly AttendanceItem[] {
  const now = new Date();
  const today = toIsoDate(now);
  const tomorrow = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

  return [
    {
      id: 'att-1',
      patientName: 'Danildo Mendes Gato',
      protocol: '#50101',
      exams: ['GLICOSE', 'COLESTEROL'],
      urgency: 'normal',
      status: 'waiting',
      scheduledAt: `${today}T08:10:00`,
    },
    {
      id: 'att-2',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
    {
      id: 'att-3',
      patientName: 'Willian Batista Guerreiro',
      protocol: '#50100',
      exams: ['HEMOGRAMA COMPLETO'],
      urgency: 'urgent',
      status: 'done',
      scheduledAt: `${today}T07:40:00`,
      completedAt: `${today}T10:30:00`,
    },
    {
      id: 'att-4',
      patientName: 'Maria Souza',
      protocol: '#50120',
      exams: ['UREIA', 'CREATININA'],
      urgency: 'normal',
      status: 'waiting',
      scheduledAt: `${tomorrow}T11:00:00`,
    },
    {
      id: 'att-5',
      patientName: 'Maria Souza',
      protocol: '#50121',
      exams: ['UREIA', 'CREATININA', 'HEMOGRAMA COMPLETO', 'BETA HCG', 'GLICOSE', 'COLESTEROL', 'EXAME DE COVID'],
      urgency: 'normal',
      status: 'waiting',
      scheduledAt: `${tomorrow}T12:00:00`,
    },
     {
      id: 'att-6',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG', 'HEMOGRAMA COMPLETO', 'UREIA', 'CREATININA', 'GLICOSE', 'COLESTEROL', 'EXAME DE COVID'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
     {
      id: 'att-7',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
     {
      id: 'att-8',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
     {
      id: 'att-9',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG', 'HEMOGRAMA COMPLETO', 'UREIA', 'CREATININA', 'GLICOSE', 'COLESTEROL', 'EXAME DE COVID'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
     {
      id: 'att-10',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
     {
      id: 'att-11',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
     {
      id: 'att-12',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
     {
      id: 'att-13',
      patientName: 'Glenda do Carmo Martins Freire',
      protocol: '#50102',
      exams: ['BETA HCG'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${today}T09:20:00`,
    },
  ];
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
