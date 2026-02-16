use std::sync::Arc;

use crate::{
  app::error::AppError,
  domain::patients::{
    dto::PatientRecordView, errors::PatientRepositoryError, ports::PatientRepository,
  },
};

pub struct GetPatientRecordUseCase {
  repo: Arc<dyn PatientRepository>,
}

impl GetPatientRecordUseCase {
  pub fn new(repo: Arc<dyn PatientRepository>) -> Self {
    Self { repo }
  }

  pub async fn execute(&self, patient_id: String) -> Result<PatientRecordView, AppError> {
    if patient_id.trim().is_empty() {
      return Err(AppError::Validation("patient_id is required".into()));
    }

    self
      .repo
      .get_patient_record(patient_id)
      .await
      .map_err(map_repo_error)
  }
}

fn map_repo_error(err: PatientRepositoryError) -> AppError {
  match err {
    PatientRepositoryError::PersistenceError => {
      AppError::Database("failed to fetch patient record".into())
    }
    PatientRepositoryError::NotFound => AppError::Database("patient not found".into()),
    PatientRepositoryError::Conflict => {
      AppError::Database("conflict while fetching patient record".into())
    }
  }
}
