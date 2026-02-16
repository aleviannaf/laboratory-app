use std::sync::Arc;

use sqlx::SqlitePool;

use crate::{
  app::{error::AppError, state::AppState},
  application::patients::{
    create_attendance::CreateAttendanceUseCase, create_patient::CreatePatientUseCase,
    get_patient_record::GetPatientRecordUseCase, list_exam_catalog::ListExamCatalogUseCase,
    list_patients::ListPatientsUseCase,
  },
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
  let create_patient_use_case = Arc::new(CreatePatientUseCase::new(repo.clone()));
  let list_patients_use_case = Arc::new(ListPatientsUseCase::new(repo.clone()));
  let get_patient_record_use_case = Arc::new(GetPatientRecordUseCase::new(repo.clone()));
  let list_exam_catalog_use_case = Arc::new(ListExamCatalogUseCase::new(repo.clone()));
  let create_attendance_use_case = Arc::new(CreateAttendanceUseCase::new(repo));

  // 5) State
  Ok(AppState {
    create_patient_use_case,
    list_patients_use_case,
    get_patient_record_use_case,
    list_exam_catalog_use_case,
    create_attendance_use_case,
  })
}
