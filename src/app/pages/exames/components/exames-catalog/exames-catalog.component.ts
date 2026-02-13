import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import {
  ExamCatalogItem,
  ExamCatalogSection,
} from '../../models/exam-catalog.model';

@Component({
  selector: 'app-exames-catalog',
  standalone: true,
  templateUrl: './exames-catalog.component.html',
  styleUrls: ['./exames-catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamesCatalogComponent {
  @Input({ required: true }) sections!: readonly ExamCatalogSection[];

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  trackSection(_: number, section: ExamCatalogSection): string {
    return section.id;
  }

  trackItem(_: number, item: ExamCatalogItem): string {
    return item.id;
  }
}
