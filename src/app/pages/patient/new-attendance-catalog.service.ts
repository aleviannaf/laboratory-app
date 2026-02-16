import { Injectable } from '@angular/core';

import { PatientRecordApiService } from '../../core/services/patient-record-api.service';
import {
  NewAttendanceCatalogItem,
  NewAttendanceCatalogSection,
} from './models/new-attendance.model';

@Injectable({ providedIn: 'root' })
export class NewAttendanceCatalogService {
  private cache: readonly CatalogItemWithCategory[] = [];
  private loadingPromise: Promise<readonly CatalogItemWithCategory[]> | null = null;

  constructor(private readonly api: PatientRecordApiService) {}

  async list(query: string): Promise<readonly NewAttendanceCatalogSection[]> {
    const items = await this.loadCatalog();
    const normalized = query.trim().toLowerCase();

    const filtered = normalized
      ? items.filter((item) => item.name.toLowerCase().includes(normalized))
      : items;

    return groupByCategory(filtered);
  }

  findById(id: string): NewAttendanceCatalogItem | undefined {
    const item = this.cache.find((catalogItem) => catalogItem.id === id);
    if (!item) {
      return undefined;
    }

    return {
      id: item.id,
      name: item.name,
      price: item.price,
      categoryId: item.categoryId,
    };
  }

  private async loadCatalog(): Promise<readonly CatalogItemWithCategory[]> {
    if (this.cache.length > 0) {
      return this.cache;
    }

    if (!this.loadingPromise) {
      this.loadingPromise = this.api
        .listExamCatalog()
        .then((items) =>
          items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price_cents / 100,
            categoryId: item.category_id,
            categoryTitle: item.category_title,
          }))
        )
        .then((mapped) => {
          this.cache = mapped;
          return mapped;
        })
        .finally(() => {
          this.loadingPromise = null;
        });
    }

    return this.loadingPromise;
  }
}

type CatalogItemWithCategory = NewAttendanceCatalogItem & {
  categoryTitle: string;
};

function groupByCategory(
  items: readonly CatalogItemWithCategory[]
): readonly NewAttendanceCatalogSection[] {
  const sectionsById = new Map<string, { title: string; items: NewAttendanceCatalogItem[] }>();

  for (const item of items) {
    const section = sectionsById.get(item.categoryId);
    if (section) {
      section.items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        categoryId: item.categoryId,
      });
      continue;
    }

    sectionsById.set(item.categoryId, {
      title: item.categoryTitle,
      items: [
        {
          id: item.id,
          name: item.name,
          price: item.price,
          categoryId: item.categoryId,
        },
      ],
    });
  }

  return Array.from(sectionsById.entries()).map(([id, section]) => ({
    id,
    title: section.title,
    items: section.items,
  }));
}
