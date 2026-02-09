use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePatientInput {
  pub full_name: String,
  pub birth_date: String,
  pub sex: String,
  pub phone: String,
  pub address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatientView {
  pub id: String,
  pub full_name: String,
  pub birth_date: String,
  pub sex: String,
  pub phone: String,
  pub address: String,
  pub created_at: String,
  pub updated_at: String,
}
