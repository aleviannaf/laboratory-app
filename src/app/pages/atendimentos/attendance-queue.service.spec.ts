import { AttendanceQueueService } from './attendance-queue.service';
import { AttendanceItem } from './models/attendance-queue.model';

describe('AttendanceQueueService', () => {
  let service: AttendanceQueueService;
  const date = '2026-02-13';
  const otherDate = '2026-02-14';

  const items: readonly AttendanceItem[] = [
    {
      id: '1',
      patientName: 'Maria',
      protocol: '#100',
      exams: ['GLICOSE'],
      urgency: 'normal',
      status: 'waiting',
      scheduledAt: `${date}T08:00:00`,
    },
    {
      id: '2',
      patientName: 'Joao',
      protocol: '#101',
      exams: ['BETA HCG'],
      urgency: 'urgent',
      status: 'done',
      scheduledAt: `${date}T09:00:00`,
      completedAt: `${date}T10:00:00`,
    },
    {
      id: '3',
      patientName: 'Ana',
      protocol: '#102',
      exams: ['COLESTEROL'],
      urgency: 'emergency',
      status: 'waiting',
      scheduledAt: `${otherDate}T11:00:00`,
    },
  ];

  beforeEach(() => {
    service = new AttendanceQueueService();
  });

  it('filters by tab correctly', () => {
    const scheduled = service.filterByTab(items, 'scheduled');
    const completed = service.filterByTab(items, 'completed');

    expect(scheduled.length).toBe(2);
    expect(completed.length).toBe(1);
    expect(completed[0].id).toBe('2');
  });

  it('filters by date correctly', () => {
    const inDate = service.filterByDate(items, date);
    expect(inDate.length).toBe(2);
    expect(inDate.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('filters by query using name protocol and exams', () => {
    expect(service.filterByQuery(items, 'maria').length).toBe(1);
    expect(service.filterByQuery(items, '#101').length).toBe(1);
    expect(service.filterByQuery(items, 'beta').length).toBe(1);
  });

  it('markAsDone updates status and completedAt keeping other fields', () => {
    const when = `${date}T12:30:00`;
    const updated = service.markAsDone(items, '1', when);
    const done = updated.find((item) => item.id === '1');
    const untouched = updated.find((item) => item.id === '3');

    expect(done?.status).toBe('done');
    expect(done?.completedAt).toBe(when);
    expect(done?.patientName).toBe('Maria');
    expect(untouched?.status).toBe('waiting');
  });
});
