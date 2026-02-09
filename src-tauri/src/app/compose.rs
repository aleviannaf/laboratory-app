use std::sync::Arc;

use sqlx::SqlitePool;

use crate::{
  app::{error::AppError, state::AppState},
  application::patients::create_patient::CreatePatientUseCase,
  infra::{
    db::sqlite::{create_sqlite_pool, run_migrations},
    repositories::patients_sqlite::PatientsSqliteRepository,
  },
};

pub async fn compose(db_path: &str) -> Result<AppState, AppError> {
  // 1) Pool
  let pool: SqlitePool = create_sqlite_pool(db_path)
    .await
    .map_err(|e| AppError::Database(format!("failed to create sqlite pool: {e}")))?;

  // 2) Migrations
  run_migrations(&pool)
    .await
    .map_err(|e| AppError::Database(format!("failed to run migrations: {e}")))?;

  // 3) Repository (concreto, infra)
  let repo = Arc::new(PatientsSqliteRepository::new(pool));

  // 4) Use case (application)
  let create_patient_use_case = Arc::new(CreatePatientUseCase::new(repo));

  // 5) State
  Ok(AppState {
    create_patient_use_case,
  })
}
