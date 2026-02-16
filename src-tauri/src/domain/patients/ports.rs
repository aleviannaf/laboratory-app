use async_trait::async_trait;

use super::{
  dto::{
    CreateAttendanceInput, CreatePatientInput, ExamCatalogItemView, PatientRecordEntryView,
    PatientRecordView,
  },
  entity::Patient,
  errors::PatientRepositoryError,
};

#[async_trait]
pub trait PatientRepository: Send + Sync {
  async fn insert(&self, input: CreatePatientInput) -> Result<Patient, PatientRepositoryError>;
  async fn list(&self, query: Option<String>) -> Result<Vec<Patient>, PatientRepositoryError>;
  async fn get_patient_record(
    &self,
    patient_id: String,
  ) -> Result<PatientRecordView, PatientRepositoryError>;
  async fn list_exam_catalog(&self) -> Result<Vec<ExamCatalogItemView>, PatientRepositoryError>;
  async fn create_attendance(
    &self,
    input: CreateAttendanceInput,
  ) -> Result<PatientRecordEntryView, PatientRepositoryError>;
}
