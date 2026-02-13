use std::sync::Arc;

use crate::{
  app::error::AppError,
  domain::patients::{
    dto::{CreatePatientInput, PatientView},
    entity::Patient,
    errors::{PatientDomainError, PatientRepositoryError},
    ports::PatientRepository,
  },
};

pub struct CreatePatientUseCase {
  repo: Arc<dyn PatientRepository>,
}

impl CreatePatientUseCase {
  pub fn new(repo: Arc<dyn PatientRepository>) -> Self {
    Self { repo }
  }

  pub async fn execute(&self, input: CreatePatientInput) -> Result<PatientView, AppError> {
    validate_create_input(&input)?;

    let persisted = self
      .repo
      .insert(input)
      .await
      .map_err(map_repo_error)?;

    let patient = Patient::new(
      persisted.id,
      persisted.full_name,
      persisted.cpf,
      persisted.birth_date,
      persisted.sex,
      persisted.phone,
      persisted.address,
      persisted.created_at,
      persisted.updated_at,
    )
    .map_err(map_domain_error)?;

    Ok(to_view(patient))
  }
}

fn validate_create_input(input: &CreatePatientInput) -> Result<(), AppError> {
  if input.full_name.trim().is_empty() {
    return Err(AppError::Validation("full_name is required".into()));
  }
  if input.cpf.trim().is_empty() {
    return Err(AppError::Validation("cpf is required".into()));
  }
  Ok(())
}

fn map_domain_error(err: PatientDomainError) -> AppError {
  match err {
    PatientDomainError::FullNameRequired => AppError::Validation("full_name is required".into()),
    PatientDomainError::CpfRequired => AppError::Validation("cpf is required".into()),
  }
}

fn map_repo_error(err: PatientRepositoryError) -> AppError {
  match err {
    PatientRepositoryError::PersistenceError => {
      AppError::Database("failed to persist patient".into())
    }
    PatientRepositoryError::Conflict => AppError::Database("conflict while saving patient".into()),
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
