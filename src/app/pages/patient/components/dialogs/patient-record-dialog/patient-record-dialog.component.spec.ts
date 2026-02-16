import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { PatientRecordService } from '../../../patient-record.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import {
  NewAttendanceDialogResult,
} from '../new-attendance-dialog/new-attendance-dialog.component';
import { PatientRecordDialogComponent } from './patient-record-dialog.component';

describe('PatientRecordDialogComponent', () => {
  let fixture: ComponentFixture<PatientRecordDialogComponent>;
  let component: PatientRecordDialogComponent;
  let patientRecordService: jasmine.SpyObj<PatientRecordService>;
  let dialog: jasmine.SpyObj<Dialog>;
  let closed$: Subject<NewAttendanceDialogResult | void>;

  beforeEach(async () => {
    closed$ = new Subject<NewAttendanceDialogResult | void>();

    patientRecordService = jasmine.createSpyObj<PatientRecordService>('PatientRecordService', [
      'getRecordByPatientId',
    ]);
    patientRecordService.getRecordByPatientId.and.resolveTo(makeRecord());

    dialog = jasmine.createSpyObj<Dialog>('Dialog', ['open']);
    dialog.open.and.returnValue({
      closed: closed$.asObservable(),
    } as DialogRef);

    await TestBed.configureTestingModule({
      imports: [PatientRecordDialogComponent],
      providers: [
        { provide: Dialog, useValue: dialog },
        { provide: DialogRef, useValue: jasmine.createSpyObj<DialogRef>('DialogRef', ['close']) },
        { provide: DIALOG_DATA, useValue: { record: makeRecord() } },
        { provide: PatientRecordService, useValue: patientRecordService },
        {
          provide: ToastService,
          useValue: jasmine.createSpyObj<ToastService>('ToastService', ['error']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientRecordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await flushPromises();
  });

  it('reloads record after a successful new attendance creation', async () => {
    component.onNewAttendanceClick();
    closed$.next({ created: true });
    await flushPromises();

    expect(patientRecordService.getRecordByPatientId).toHaveBeenCalledTimes(2);
  });
});

function makeRecord() {
  return {
    patient: {
      id: 'pt-1',
      name: 'Maria Souza',
      document: '123.456.789-00',
      fullName: 'Maria Souza',
      cpf: '123.456.789-00',
      birthDate: '1991-10-01',
      sex: 'F',
      phone: '(11) 99999-9999',
      address: 'Rua A',
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
    },
    email: 'maria.souza@email.com',
    entries: [],
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
