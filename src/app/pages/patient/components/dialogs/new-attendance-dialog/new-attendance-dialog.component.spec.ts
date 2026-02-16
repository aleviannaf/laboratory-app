import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAttendanceCatalogService } from '../../../new-attendance-catalog.service';
import { PatientRecordService } from '../../../patient-record.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { NewAttendanceDialogComponent } from './new-attendance-dialog.component';

describe('NewAttendanceDialogComponent', () => {
  let fixture: ComponentFixture<NewAttendanceDialogComponent>;
  let component: NewAttendanceDialogComponent;
  let dialogRef: jasmine.SpyObj<DialogRef>;
  let catalogService: jasmine.SpyObj<NewAttendanceCatalogService>;
  let patientRecordService: jasmine.SpyObj<PatientRecordService>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj<DialogRef>('DialogRef', ['close']);
    catalogService = jasmine.createSpyObj<NewAttendanceCatalogService>('NewAttendanceCatalogService', [
      'list',
      'findById',
    ]);
    patientRecordService = jasmine.createSpyObj<PatientRecordService>('PatientRecordService', [
      'createAttendance',
    ]);

    catalogService.list.and.resolveTo([
      {
        id: 'bioquimica',
        title: 'Bioquimica',
        items: [{ id: 'glicose', name: 'Glicose', price: 10, categoryId: 'bioquimica' }],
      },
    ]);
    catalogService.findById.and.returnValue({
      id: 'glicose',
      name: 'Glicose',
      price: 10,
      categoryId: 'bioquimica',
    });
    patientRecordService.createAttendance.and.resolveTo({
      id: 'ex-1',
      date: '14/02/2026',
      exams: [],
    });

    await TestBed.configureTestingModule({
      imports: [NewAttendanceDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { patientId: 'pt-1', patientName: 'Maria Souza' } },
        { provide: NewAttendanceCatalogService, useValue: catalogService },
        { provide: PatientRecordService, useValue: patientRecordService },
        {
          provide: ToastService,
          useValue: jasmine.createSpyObj<ToastService>('ToastService', ['error']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewAttendanceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('persists attendance and closes dialog on success', async () => {
    component.selectedExamIds.set(['glicose']);

    await component.confirm();

    expect(patientRecordService.createAttendance).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith({ created: true });
  });
});
