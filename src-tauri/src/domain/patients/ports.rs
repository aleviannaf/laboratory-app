use async_trait::async_trait;

use super::{dto::CreatePatientInput, entity::Patient, errors::PatientRepositoryError};

#[async_trait]
pub trait PatientRepository: Send + Sync {
  async fn insert(&self, input: CreatePatientInput) -> Result<Patient, PatientRepositoryError>;
}
