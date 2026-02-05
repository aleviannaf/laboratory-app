import { Routes } from "@angular/router";
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
   children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./pages/pacientes/pacientes.component').then(m => m.PacientesComponent),
      },
      {
        path: 'exames',
        loadComponent: () =>
          import('./pages/exames/exames.component').then(m => m.ExamesComponent),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./pages/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent),
      },
    ],
  },
];



