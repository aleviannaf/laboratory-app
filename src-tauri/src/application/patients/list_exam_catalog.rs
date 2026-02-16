use std::sync::Arc;

use crate::{
  app::error::AppError,
  domain::patients::{
    dto::ExamCatalogItemView, errors::PatientRepositoryError, ports::PatientRepository,
  },
};

pub struct ListExamCatalogUseCase {
  repo: Arc<dyn PatientRepository>,
}

impl ListExamCatalogUseCase {
  pub fn new(repo: Arc<dyn PatientRepository>) -> Self {
    Self { repo }
  }

  pub async fn execute(&self) -> Result<Vec<ExamCatalogItemView>, AppError> {
    self.repo.list_exam_catalog().await.map_err(map_repo_error)
  }
}

fn map_repo_error(err: PatientRepositoryError) -> AppError {
  match err {
    PatientRepositoryError::PersistenceError => {
      AppError::Database("failed to fetch exam catalog".into())
    }
    PatientRepositoryError::NotFound => AppError::Database("exam catalog not found".into()),
    PatientRepositoryError::Conflict => {
      AppError::Database("conflict while fetching exam catalog".into())
    }
  }
}
