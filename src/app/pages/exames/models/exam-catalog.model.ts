export interface ExamCatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  turnaroundHours: number;
}

export interface ExamCatalogSection {
  id: string;
  title: string;
  items: readonly ExamCatalogItem[];
}
