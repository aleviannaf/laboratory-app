import { Component } from '@angular/core';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { WeeklyFlowChartComponent } from './components/weekly-flow-chart/weekly-flow-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardHeaderComponent, QuickActionsComponent, WeeklyFlowChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  weeklyLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  weeklyValues = [45, 52, 49, 61, 55, 30, 12];
}
