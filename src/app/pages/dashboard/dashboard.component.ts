import { Component, inject } from '@angular/core';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { WeeklyFlowChartComponent } from './components/weekly-flow-chart/weekly-flow-chart.component';
import { PatientModalService } from '../../shared/ui/modal-patient/patient-modal.service';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardHeaderComponent, QuickActionsComponent, WeeklyFlowChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {

  private patientModal = inject(PatientModalService);
  weeklyLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  weeklyValues = [45, 52, 49, 61, 55, 30, 12];

   onCreatePatient() {
    this.patientModal.openCreate().subscribe(result => {
      if (!result) return; // cancelou

      // aqui você chama seu service/repository pra salvar
      // this.patientsService.create(result).subscribe(...)
      console.log('Criar paciente:', result);
    });
  }
}
