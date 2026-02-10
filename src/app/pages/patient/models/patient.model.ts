export interface Patient {
  id: string;
  name: string;
  document: string;
  createdAt?: string; // opcional (ISO), útil quando vier da API
}
