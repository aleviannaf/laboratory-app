import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ExamCatalogService } from './exam-catalog.service';
import { ExamesHeaderComponent } from './components/exames-header/exames-header.component';
import { ExamesFiltersComponent } from './components/exames-filters/exames-filters.component';
import { ExamesCatalogComponent } from './components/exames-catalog/exames-catalog.component';
import { ExamesEmptyStateComponent } from './components/exames-empty-state/exames-empty-state.component';

@Component({
  selector: 'app-exames',
  standalone: true,
  imports: [
    ExamesHeaderComponent,
    ExamesFiltersComponent,
    ExamesCatalogComponent,
    ExamesEmptyStateComponent,
  ],
  templateUrl: './exames.component.html',
  styleUrl: './exames.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamesComponent {
  private readonly catalogService = inject(ExamCatalogService);
  readonly query = signal('');

  readonly sections = computed(() =>
    this.catalogService.filterSections(this.query())
  );

  readonly hasResults = computed(() =>
    this.sections().some((section) => section.items.length > 0)
  );

  onFilterChange(value: string): void {
    this.query.set(value);
  }
}
