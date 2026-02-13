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
        path: 'exames',
        loadComponent: () =>
          import('./pages/exames/exames.component').then(m => m.ExamesComponent),
      },
      {
        path: 'atendimentos',
        loadComponent: () =>
          import('./pages/atendimentos/atendimentos.component').then(
            (m) => m.AtendimentosComponent
          ),
      },
        {
        path: 'patients',
        loadChildren: () =>
          import('./pages/patient/patient.routes').then((m) => m.PATIENT_ROUTES),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./pages/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent),
      },
    ],
  },
];



