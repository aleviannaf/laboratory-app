use std::sync::Arc;

use crate::{
  app::error::AppError,
  domain::patients::{
    dto::{AttendanceQueueItemView, CompleteAttendanceInput},
    errors::PatientRepositoryError,
    ports::PatientRepository,
  },
};

pub struct CompleteAttendanceUseCase {
  repo: Arc<dyn PatientRepository>,
}

impl CompleteAttendanceUseCase {
  pub fn new(repo: Arc<dyn PatientRepository>) -> Self {
    Self { repo }
  }

  pub async fn execute(&self, input: CompleteAttendanceInput) -> Result<AttendanceQueueItemView, AppError> {
    if input.attendance_id.trim().is_empty() {
      return Err(AppError::Validation("attendance_id is required".into()));
    }

    self.repo.complete_attendance(input).await.map_err(map_repo_error)
  }
}

fn map_repo_error(err: PatientRepositoryError) -> AppError {
  match err {
    PatientRepositoryError::PersistenceError => {
      AppError::Database("failed to complete attendance".into())
    }
    PatientRepositoryError::NotFound => AppError::Database("attendance not found".into()),
    PatientRepositoryError::Conflict => {
      AppError::Database("conflict while completing attendance".into())
    }
  }
}
