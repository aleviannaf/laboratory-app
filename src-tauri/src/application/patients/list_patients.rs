use std::sync::Arc;

use crate::{
  app::error::AppError,
  domain::patients::{
    dto::PatientView,
    entity::Patient,
    errors::PatientRepositoryError,
    ports::PatientRepository,
  },
};

pub struct ListPatientsUseCase {
  repo: Arc<dyn PatientRepository>,
}

impl ListPatientsUseCase {
  pub fn new(repo: Arc<dyn PatientRepository>) -> Self {
    Self { repo }
  }

  pub async fn execute(&self, query: Option<String>) -> Result<Vec<PatientView>, AppError> {
    let patients = self.repo.list(query).await.map_err(map_repo_error)?;
    Ok(patients.into_iter().map(to_view).collect())
  }
}

fn map_repo_error(err: PatientRepositoryError) -> AppError {
  match err {
    PatientRepositoryError::PersistenceError => {
      AppError::Database("failed to fetch patients".into())
    }
    PatientRepositoryError::Conflict => AppError::Database("conflict while fetching patients".into()),
    PatientRepositoryError::NotFound => AppError::Database("patient not found".into()),
  }
}

fn to_view(p: Patient) -> PatientView {
  PatientView {
    id: p.id,
    full_name: p.full_name,
    cpf: p.cpf,
    birth_date: p.birth_date,
    sex: p.sex,
    phone: p.phone,
    address: p.address,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}
