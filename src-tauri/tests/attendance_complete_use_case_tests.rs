use std::sync::Arc;

use laboratory_app_lib::{
  app::error::AppError,
  application::patients::complete_attendance::CompleteAttendanceUseCase,
  domain::patients::{
    dto::{AttendanceQueueItemView, AttendanceQueueQueryInput, CompleteAttendanceInput},
    entity::Patient,
    errors::PatientRepositoryError,
    ports::PatientRepository,
  },
};

struct StubCompleteAttendanceRepository {
  result: Result<AttendanceQueueItemView, PatientRepositoryError>,
}

#[async_trait::async_trait]
impl PatientRepository for StubCompleteAttendanceRepository {
  async fn insert(
    &self,
    _input: laboratory_app_lib::domain::patients::dto::CreatePatientInput,
  ) -> Result<Patient, PatientRepositoryError> {
    unimplemented!()
  }

  async fn list(&self, _query: Option<String>) -> Result<Vec<Patient>, PatientRepositoryError> {
    unimplemented!()
  }

  async fn get_patient_record(
    &self,
    _patient_id: String,
  ) -> Result<laboratory_app_lib::domain::patients::dto::PatientRecordView, PatientRepositoryError>
  {
    unimplemented!()
  }

  async fn list_exam_catalog(
    &self,
  ) -> Result<
    Vec<laboratory_app_lib::domain::patients::dto::ExamCatalogItemView>,
    PatientRepositoryError,
  > {
    unimplemented!()
  }

  async fn create_attendance(
    &self,
    _input: laboratory_app_lib::domain::patients::dto::CreateAttendanceInput,
  ) -> Result<
    laboratory_app_lib::domain::patients::dto::PatientRecordEntryView,
    PatientRepositoryError,
  > {
    unimplemented!()
  }

  async fn list_attendance_queue(
    &self,
    _input: AttendanceQueueQueryInput,
  ) -> Result<Vec<AttendanceQueueItemView>, PatientRepositoryError> {
    unimplemented!()
  }

  async fn complete_attendance(
    &self,
    _input: CompleteAttendanceInput,
  ) -> Result<AttendanceQueueItemView, PatientRepositoryError> {
    self.result.clone()
  }
}

#[tokio::test]
async fn complete_attendance_requires_attendance_id() {
  let repo = StubCompleteAttendanceRepository {
    result: Err(PatientRepositoryError::PersistenceError),
  };
  let use_case = CompleteAttendanceUseCase::new(Arc::new(repo));

  let result = use_case
    .execute(CompleteAttendanceInput {
      attendance_id: "  ".to_string(),
    })
    .await;

  assert!(matches!(result, Err(AppError::Validation(msg)) if msg == "attendance_id is required"));
}

#[tokio::test]
async fn complete_attendance_returns_updated_item() {
  let repo = StubCompleteAttendanceRepository {
    result: Ok(AttendanceQueueItemView {
      attendance_id: "att-1".to_string(),
      patient_id: "pt-1".to_string(),
      patient_name: "Maria".to_string(),
      patient_cpf: "12345678900".to_string(),
      exam_date: "2026-02-14".to_string(),
      status: "completed".to_string(),
      exam_names: vec!["Glicose".to_string()],
      updated_at: "2026-02-14T10:30:00".to_string(),
    }),
  };
  let use_case = CompleteAttendanceUseCase::new(Arc::new(repo));

  let result = use_case
    .execute(CompleteAttendanceInput {
      attendance_id: "att-1".to_string(),
    })
    .await;

  match result {
    Ok(item) => assert_eq!(item.status, "completed"),
    Err(_) => panic!("expected success"),
  }
}

#[tokio::test]
async fn complete_attendance_maps_repository_error() {
  let repo = StubCompleteAttendanceRepository {
    result: Err(PatientRepositoryError::NotFound),
  };
  let use_case = CompleteAttendanceUseCase::new(Arc::new(repo));

  let result = use_case
    .execute(CompleteAttendanceInput {
      attendance_id: "missing".to_string(),
    })
    .await;

  assert!(matches!(result, Err(AppError::Database(msg)) if msg == "attendance not found"));
}
