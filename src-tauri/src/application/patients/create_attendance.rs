use std::sync::Arc;

use crate::{
  app::error::AppError,
  domain::patients::{
    dto::{CreateAttendanceInput, PatientRecordEntryView},
    errors::PatientRepositoryError,
    ports::PatientRepository,
  },
};

pub struct CreateAttendanceUseCase {
  repo: Arc<dyn PatientRepository>,
}

impl CreateAttendanceUseCase {
  pub fn new(repo: Arc<dyn PatientRepository>) -> Self {
    Self { repo }
  }

  pub async fn execute(
    &self,
    input: CreateAttendanceInput,
  ) -> Result<PatientRecordEntryView, AppError> {
    if input.patient_id.trim().is_empty() {
      return Err(AppError::Validation("patient_id is required".into()));
    }
    if input.exam_date.trim().is_empty() {
      return Err(AppError::Validation("exam_date is required".into()));
    }
    if input.items.is_empty() {
      return Err(AppError::Validation("items is required".into()));
    }

    self.repo.create_attendance(input).await.map_err(map_repo_error)
  }
}

fn map_repo_error(err: PatientRepositoryError) -> AppError {
  match err {
    PatientRepositoryError::PersistenceError => {
      AppError::Database("failed to create attendance".into())
    }
    PatientRepositoryError::NotFound => AppError::Database("patient not found".into()),
    PatientRepositoryError::Conflict => AppError::Database("conflict while creating attendance".into()),
  }
}
