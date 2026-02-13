import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-exames-header',
  standalone: true,
  templateUrl: './exames-header.component.html',
  styleUrls: ['./exames-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamesHeaderComponent {}
