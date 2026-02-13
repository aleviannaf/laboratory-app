import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AtendimentosComponent } from './atendimentos.component';
import { AttendanceQueueService } from './attendance-queue.service';
import { AttendanceItem } from './models/attendance-queue.model';
import { Dialog } from '@angular/cdk/dialog';
import {
  ConfirmCompleteDialogComponent,
} from './components/dialogs/confirm-complete-dialog/confirm-complete-dialog.component';
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
  private readonly list: readonly AttendanceItem[] = [
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

  getSeed(): readonly AttendanceItem[] {
    return this.list;
  }

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

  markAsDone(items: readonly AttendanceItem[], id: string, whenIso: string): readonly AttendanceItem[] {
    return items.map((item) =>
      item.id === id ? { ...item, status: 'done', completedAt: whenIso } : item
    );
  }

  findById(items: readonly AttendanceItem[], id: string): AttendanceItem | undefined {
    return items.find((item) => item.id === id);
  }
}

describe('AtendimentosComponent', () => {
  let fixture: ComponentFixture<AtendimentosComponent>;
  let component: AtendimentosComponent;
  let dialog: DialogMock;

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
    component.selectedDate.set('2026-02-13');
    fixture.detectChanges();
  });

  it('changes tab and updates filtered list', () => {
    expect(component.filteredItems().length).toBe(1);
    component.onTabChange('completed');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].status).toBe('done');
  });

  it('moves item to completed after confirmation', () => {
    dialog.nextResult = true;

    component.onCompleteClick('1');

    const updated = component.items().find((item) => item.id === '1');
    expect(updated?.status).toBe('done');
    expect(updated?.completedAt).toBeTruthy();
  });

  it('does not change item when completion is cancelled', () => {
    dialog.nextResult = false;

    component.onCompleteClick('1');

    const item = component.items().find((entry) => entry.id === '1');
    expect(item?.status).toBe('waiting');
    expect(item?.completedAt).toBeUndefined();
  });

  it('applies date from date filter dialog', () => {
    dialog.nextResult = '2026-02-14';

    component.onOtherDatesClick();

    expect(component.selectedDate()).toBe('2026-02-14');
  });

  it('opens details dialog for selected item', () => {
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
