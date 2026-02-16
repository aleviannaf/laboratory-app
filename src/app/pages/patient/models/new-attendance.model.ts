export interface NewAttendanceCatalogItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

export interface NewAttendanceCatalogSection {
  id: string;
  title: string;
  items: readonly NewAttendanceCatalogItem[];
}

export interface CreateAttendancePayload {
  patientId: string;
  examDate: string;
  examIds: readonly string[];
  requesterId?: string;
}
