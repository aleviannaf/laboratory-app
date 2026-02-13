import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtendimentosTableComponent } from './atendimentos-table.component';
import { AttendanceItem } from '../../models/attendance-queue.model';

describe('AtendimentosTableComponent', () => {
  let fixture: ComponentFixture<AtendimentosTableComponent>;
  let component: AtendimentosTableComponent;

  const items: readonly AttendanceItem[] = [
    {
      id: 'att-1',
      patientName: 'Maria',
      protocol: '#5001',
      exams: ['GLICOSE'],
      urgency: 'normal',
      status: 'waiting',
      scheduledAt: '2026-02-13T08:00:00',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtendimentosTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AtendimentosTableComponent);
    component = fixture.componentInstance;
    component.items = items;
    component.tab = 'scheduled';
    fixture.detectChanges();
  });

  it('renders input rows', () => {
    const row = fixture.nativeElement.querySelector('.table-row');
    expect(row).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Maria');
    expect(fixture.nativeElement.textContent).toContain('#5001');
  });

  it('emits completeClick with row id', () => {
    const spy = spyOn(component.completeClick, 'emit');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.action-btn.complete');

    button.click();

    expect(spy).toHaveBeenCalledWith('att-1');
  });

  it('emits viewClick with row id', () => {
    const spy = spyOn(component.viewClick, 'emit');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.action-btn.view');

    button.click();

    expect(spy).toHaveBeenCalledWith('att-1');
  });
});
