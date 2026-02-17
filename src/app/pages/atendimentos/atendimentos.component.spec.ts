import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AtendimentosComponent } from './atendimentos.component';
import { AttendanceQueueService } from './attendance-queue.service';
import { AttendanceItem } from './models/attendance-queue.model';
import { Dialog } from '@angular/cdk/dialog';
import { ConfirmCompleteDialogComponent } from './components/dialogs/confirm-complete-dialog/confirm-complete-dialog.component';
import { DateFilterDialogComponent } from './components/dialogs/date-filter-dialog/date-filter-dialog.component';
import { AttendanceDetailsDialogComponent } from './components/dialogs/attendance-details-dialog/attendance-details-dialog.component';

class DialogMock {
  nextResult: unknown = undefined;
  open = jasmine.createSpy('open').and.callFake((component: unknown) => {
    if (component === ConfirmCompleteDialogComponent) {
      return { closed: of(this.nextResult as boolean) };
    }
    if (component === DateFilterDialogComponent) {
      return { closed: of(this.nextResult as string | undefined) };
    }
    return { closed: of(undefined) };
  });
}

class AttendanceQueueServiceMock {
  readonly list: readonly AttendanceItem[] = [
    {
      id: '1',
      patientName: 'Maria',
      protocol: '#100',
      exams: ['GLICOSE'],
      urgency: 'normal',
      status: 'waiting',
      scheduledAt: '2026-02-13T08:00:00',
    },
    {
      id: '2',
      patientName: 'Joao',
      protocol: '#101',
      exams: ['BETA HCG'],
      urgency: 'urgent',
      status: 'done',
      scheduledAt: '2026-02-13T09:00:00',
      completedAt: '2026-02-13T10:00:00',
    },
  ];

  loadQueue = jasmine.createSpy('loadQueue').and.resolveTo(this.list);
  completeAttendance = jasmine.createSpy('completeAttendance').and.resolveTo({
    ...this.list[0],
    status: 'done',
    completedAt: '2026-02-13T12:00:00',
  } satisfies AttendanceItem);

  filterByDate(items: readonly AttendanceItem[], dateIso: string): readonly AttendanceItem[] {
    return items.filter((item) => item.scheduledAt.startsWith(dateIso));
  }

  filterByTab(items: readonly AttendanceItem[], tab: 'scheduled' | 'completed'): readonly AttendanceItem[] {
    return items.filter((item) => item.status === (tab === 'scheduled' ? 'waiting' : 'done'));
  }

  filterByQuery(items: readonly AttendanceItem[], query: string): readonly AttendanceItem[] {
    const q = query.toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.patientName.toLowerCase().includes(q));
  }

  countByTab(items: readonly AttendanceItem[], dateIso: string): { scheduled: number; completed: number } {
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

describe('AtendimentosComponent', () => {
  let fixture: ComponentFixture<AtendimentosComponent>;
  let component: AtendimentosComponent;
  let dialog: DialogMock;
  let queueService: AttendanceQueueServiceMock;

  beforeEach(async () => {
    dialog = new DialogMock();

    await TestBed.configureTestingModule({
      imports: [AtendimentosComponent],
      providers: [
        { provide: AttendanceQueueService, useClass: AttendanceQueueServiceMock },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AtendimentosComponent);
    component = fixture.componentInstance;
    queueService = TestBed.inject(AttendanceQueueService) as unknown as AttendanceQueueServiceMock;
  });

  it('loads queue from backend on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(queueService.loadQueue).toHaveBeenCalled();
    expect(component.items().length).toBe(2);
  });

  it('changes tab without reloading queue', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onTabChange('completed');

    expect(queueService.loadQueue).toHaveBeenCalledTimes(1);
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].status).toBe('done');
  });

  it('completes item and reloads queue after confirmation', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    dialog.nextResult = true;

    component.onCompleteClick('1');
    await fixture.whenStable();

    expect(queueService.completeAttendance).toHaveBeenCalledWith('1');
    expect(queueService.loadQueue).toHaveBeenCalledTimes(2);
  });

  it('does not complete item when confirmation is cancelled', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    dialog.nextResult = false;

    component.onCompleteClick('1');
    await fixture.whenStable();

    expect(queueService.completeAttendance).not.toHaveBeenCalled();
  });

  it('applies date from date filter dialog and reloads queue', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    dialog.nextResult = '2026-02-14';

    component.onOtherDatesClick();
    await fixture.whenStable();

    expect(component.selectedDate()).toBe('2026-02-14');
    expect(queueService.loadQueue).toHaveBeenCalledTimes(2);
  });

  it('opens details dialog for selected item', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onViewClick('1');

    expect(dialog.open).toHaveBeenCalledWith(
      AttendanceDetailsDialogComponent,
      jasmine.objectContaining({
        data: jasmine.objectContaining({
          item: jasmine.objectContaining({ id: '1' }),
        }),
      })
    );
  });
});
