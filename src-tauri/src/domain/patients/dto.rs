use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePatientInput {
  pub full_name: String,
  pub cpf: String,
  pub birth_date: String,
  pub sex: String,
  pub phone: String,
  pub address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatientView {
  pub id: String,
  pub full_name: String,
  pub cpf: String,
  pub birth_date: String,
  pub sex: String,
  pub phone: String,
  pub address: String,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAttendanceInput {
  pub patient_id: String,
  pub exam_date: String,
  pub requester_id: Option<String>,
  pub status: Option<String>,
  pub procedure_type: Option<String>,
  pub delivered_to: Option<String>,
  pub notes: Option<String>,
  pub items: Vec<CreateAttendanceItemInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAttendanceItemInput {
  pub name: String,
  pub unit: Option<String>,
  pub method: Option<String>,
  pub reference_range: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExamCatalogItemView {
  pub id: String,
  pub name: String,
  pub category_id: String,
  pub category_title: String,
  pub price_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatientRecordView {
  pub patient: PatientView,
  pub entries: Vec<PatientRecordEntryView>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatientRecordEntryView {
  pub exam_id: String,
  pub exam_date: String,
  pub status: String,
  pub requester_name: Option<String>,
  pub items: Vec<PatientRecordExamItemView>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatientRecordExamItemView {
  pub exam_item_id: String,
  pub name: String,
  pub unit: Option<String>,
  pub method: Option<String>,
  pub reference_range: Option<String>,
  pub result_value: Option<String>,
  pub result_flag: Option<String>,
  pub report_available: bool,
}
