use std::sync::Arc;

use crate::{
  app::error::AppError,
  domain::patients::{
    dto::{AttendanceQueueItemView, AttendanceQueueQueryInput},
    errors::PatientRepositoryError,
    ports::PatientRepository,
  },
};

pub struct ListAttendanceQueueUseCase {
  repo: Arc<dyn PatientRepository>,
}

impl ListAttendanceQueueUseCase {
  pub fn new(repo: Arc<dyn PatientRepository>) -> Self {
    Self { repo }
  }

  pub async fn execute(
    &self,
    input: AttendanceQueueQueryInput,
  ) -> Result<Vec<AttendanceQueueItemView>, AppError> {
    if let Some(date) = &input.date {
      if !is_date_only(date) {
        return Err(AppError::Validation("date must be YYYY-MM-DD".into()));
      }
    }
    if let Some(status) = &input.status {
      if status != "waiting" && status != "completed" {
        return Err(AppError::Validation("status must be waiting or completed".into()));
      }
    }

    self.repo.list_attendance_queue(input).await.map_err(map_repo_error)
  }
}

fn map_repo_error(err: PatientRepositoryError) -> AppError {
  match err {
    PatientRepositoryError::PersistenceError => {
      AppError::Database("failed to fetch attendance queue".into())
    }
    PatientRepositoryError::NotFound => AppError::Database("attendance not found".into()),
    PatientRepositoryError::Conflict => {
      AppError::Database("conflict while fetching attendance queue".into())
    }
  }
}

fn is_date_only(value: &str) -> bool {
  let bytes = value.as_bytes();
  if bytes.len() != 10 {
    return false;
  }
  bytes[0].is_ascii_digit()
    && bytes[1].is_ascii_digit()
    && bytes[2].is_ascii_digit()
    && bytes[3].is_ascii_digit()
    && bytes[4] == b'-'
    && bytes[5].is_ascii_digit()
    && bytes[6].is_ascii_digit()
    && bytes[7] == b'-'
    && bytes[8].is_ascii_digit()
    && bytes[9].is_ascii_digit()
}
