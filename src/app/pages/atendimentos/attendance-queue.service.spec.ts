import { AttendanceQueueService } from './attendance-queue.service';
import { AttendanceItem } from './models/attendance-queue.model';
import { PatientRecordApiService } from '../../core/services/patient-record-api.service';

describe('AttendanceQueueService', () => {
  let service: AttendanceQueueService;
  let api: jasmine.SpyObj<PatientRecordApiService>;

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
    api = jasmine.createSpyObj<PatientRecordApiService>('PatientRecordApiService', [
      'listAttendanceQueue',
      'completeAttendance',
    ]);
    service = new AttendanceQueueService(api);
  });

  it('loads queue from backend and maps to attendance items', async () => {
    api.listAttendanceQueue.and.resolveTo([
      {
        attendance_id: 'att-1',
        patient_id: 'pt-1',
        patient_name: 'Maria',
        patient_cpf: '12345678900',
        exam_date: '2026-02-13',
        status: 'waiting',
        exam_names: ['Glicose'],
        updated_at: '2026-02-13T08:00:00',
      },
    ]);

    const loaded = await service.loadQueue({
      date: '2026-02-13',
      query: 'maria',
    });

    expect(api.listAttendanceQueue).toHaveBeenCalledWith({
      date: '2026-02-13',
      query: 'maria',
    });
    expect(loaded.length).toBe(1);
    expect(loaded[0].patientName).toBe('Maria');
    expect(loaded[0].status).toBe('waiting');
  });

  it('maps completeAttendance to done status', async () => {
    api.completeAttendance.and.resolveTo({
      attendance_id: 'att-1',
      patient_id: 'pt-1',
      patient_name: 'Maria',
      patient_cpf: '12345678900',
      exam_date: '2026-02-13',
      status: 'completed',
      exam_names: ['Glicose'],
      updated_at: '2026-02-13T10:00:00',
    });

    const completed = await service.completeAttendance('att-1');

    expect(api.completeAttendance).toHaveBeenCalledWith({ attendance_id: 'att-1' });
    expect(completed.status).toBe('done');
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
});
