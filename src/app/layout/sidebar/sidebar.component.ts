import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavItem = { label: string; path: string; icon: string; exact?: boolean };

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  items: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: '🏠', exact: true },
    { label: 'Pacientes', path: '/patients', icon: '👤' },
    { label: 'Exames', path: '/exames', icon: '🧪' },
    { label: 'Configurações', path: '/configuracoes', icon: '⚙️' },
  ];
}
