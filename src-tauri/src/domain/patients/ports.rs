use async_trait::async_trait;

use super::{dto::CreatePatientInput, entity::Patient, errors::PatientRepositoryError};

#[async_trait]
pub trait PatientRepository: Send + Sync {
  async fn insert(&self, input: CreatePatientInput) -> Result<Patient, PatientRepositoryError>;
  async fn list(&self, query: Option<String>) -> Result<Vec<Patient>, PatientRepositoryError>;
}
