import { Injectable } from '@angular/core';

import { ExamCatalogSection } from './models/exam-catalog.model';

@Injectable({ providedIn: 'root' })
export class ExamCatalogService {
  private readonly sections: readonly ExamCatalogSection[] = [
    {
      id: 'bioquimica',
      title: 'Bioquimica',
      items: [
        {
          id: 'glicose',
          name: 'Glicose',
          description: 'Dosagem de glicose no sangue.',
          price: 10,
          turnaroundHours: 12,
        },
        {
          id: 'colesterol-total',
          name: 'Colesterol Total',
          description: 'Avaliacao do colesterol total.',
          price: 10,
          turnaroundHours: 24,
        },
        {
          id: 'triglicerideos',
          name: 'Triglicerideos',
          description: 'Nivel de triglicerideos no sangue.',
          price: 10,
          turnaroundHours: 24,
        },
        {
          id: 'ureia-creatinina',
          name: 'Bioquimica 2 (Ureia/Creatinina)',
          description: 'Avaliacao renal.',
          price: 25,
          turnaroundHours: 12,
        },
      ],
    },
    {
      id: 'hematologia',
      title: 'Hematologia',
      items: [
        {
          id: 'hemograma-completo',
          name: 'Hemograma Completo',
          description: 'Analise sanguinea completa.',
          price: 20,
          turnaroundHours: 24,
        },
      ],
    },
  ];

  getSections(): readonly ExamCatalogSection[] {
    return this.sections;
  }

  filterSections(query: string): readonly ExamCatalogSection[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.sections;

    return this.sections
      .map((section) => {
        const sectionMatches = section.title.toLowerCase().includes(q);
        if (sectionMatches) return section;

        const items = section.items.filter((item) => {
          const haystack = `${item.name} ${item.description}`.toLowerCase();
          return haystack.includes(q);
        });
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }
}
