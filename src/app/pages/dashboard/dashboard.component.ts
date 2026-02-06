import { Component } from '@angular/core';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardHeaderComponent, QuickActionsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
