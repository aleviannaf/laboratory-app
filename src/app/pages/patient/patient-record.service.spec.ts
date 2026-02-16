import { PatientRecordApiService } from '../../core/services/patient-record-api.service';
import { PatientRecordService } from './patient-record.service';

describe('PatientRecordService', () => {
  let service: PatientRecordService;
  let api: jasmine.SpyObj<PatientRecordApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<PatientRecordApiService>('PatientRecordApiService', [
      'getPatientRecord',
      'listExamCatalog',
      'createAttendance',
    ]);
    service = new PatientRecordService(api);
  });

  it('maps record dto to ui model', async () => {
    api.getPatientRecord.and.resolveTo({
      patient: {
        id: 'pt-1',
        full_name: 'Maria Souza',
        cpf: '123.456.789-00',
        birth_date: '1991-10-01',
        sex: 'F',
        phone: '(11) 99999-9999',
        address: 'Rua A',
        created_at: '2026-01-01T00:00:00',
        updated_at: '2026-01-02T00:00:00',
      },
      entries: [
        {
          exam_id: 'ex-1',
          exam_date: '2026-02-14',
          status: 'completed',
          requester_name: 'Dr. Silva',
          items: [
            {
              exam_item_id: 'it-1',
              name: 'Glicose',
              report_available: true,
            },
          ],
        },
      ],
    });

    const record = await service.getRecordByPatientId('pt-1');

    expect(record.patient.fullName).toBe('Maria Souza');
    expect(record.email).toContain('@email.com');
    expect(record.entries.length).toBe(1);
    expect(record.entries[0].exams[0].status).toBe('completed');
  });

  it('creates attendance using selected exams from catalog', async () => {
    api.listExamCatalog.and.resolveTo([
      {
        id: 'glicose',
        name: 'Glicose',
        category_id: 'bioquimica',
        category_title: 'Bioquimica',
        price_cents: 1000,
      },
    ]);
    api.createAttendance.and.resolveTo({
      exam_id: 'ex-1',
      exam_date: '2026-02-14',
      status: 'waiting',
      items: [
        {
          exam_item_id: 'it-1',
          name: 'Glicose',
          report_available: false,
        },
      ],
    });

    await service.createAttendance({
      patientId: 'pt-1',
      examDate: '2026-02-14',
      examIds: ['glicose'],
    });

    expect(api.createAttendance).toHaveBeenCalled();
  });
});
