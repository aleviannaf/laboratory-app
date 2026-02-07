// patient-create-dialog.types.ts

export type PatientDraft = Readonly<{
  fullName: string;
  cpf: string;
  birthDate: string; // você pode escolher ISO (yyyy-mm-dd) ou dd/MM/yyyy; aqui fica neutro
  phone: string;
  email: string;
  address: string;
}>;

export type PatientCreateDialogData = Readonly<{
  preset?: Partial<PatientDraft>;
}>;

export type PatientCreateDialogResult =
  | Readonly<{ type: 'cancel' }>
  | Readonly<{ type: 'submit'; payload: PatientDraft }>;
