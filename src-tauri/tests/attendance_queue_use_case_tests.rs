use std::sync::Arc;

use laboratory_app_lib::{
  app::error::AppError,
  application::patients::list_attendance_queue::ListAttendanceQueueUseCase,
  domain::patients::{
    dto::{AttendanceQueueItemView, AttendanceQueueQueryInput, CompleteAttendanceInput},
    entity::Patient,
    errors::PatientRepositoryError,
    ports::PatientRepository,
  },
};

struct StubAttendanceQueueRepository {
  result: Result<Vec<AttendanceQueueItemView>, PatientRepositoryError>,
}

#[async_trait::async_trait]
impl PatientRepository for StubAttendanceQueueRepository {
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
    self.result.clone()
  }

  async fn complete_attendance(
    &self,
    _input: CompleteAttendanceInput,
  ) -> Result<AttendanceQueueItemView, PatientRepositoryError> {
    unimplemented!()
  }
}

#[tokio::test]
async fn list_attendance_queue_returns_items() {
  let repo = StubAttendanceQueueRepository {
    result: Ok(vec![AttendanceQueueItemView {
      attendance_id: "att-1".to_string(),
      patient_id: "pt-1".to_string(),
      patient_name: "Maria".to_string(),
      patient_cpf: "12345678900".to_string(),
      exam_date: "2026-02-14".to_string(),
      status: "waiting".to_string(),
      exam_names: vec!["Glicose".to_string()],
      updated_at: "2026-02-14T09:00:00".to_string(),
    }]),
  };
  let use_case = ListAttendanceQueueUseCase::new(Arc::new(repo));

  let result = use_case
    .execute(AttendanceQueueQueryInput {
      date: Some("2026-02-14".to_string()),
      status: Some("waiting".to_string()),
      query: None,
    })
    .await;

  match result {
    Ok(items) => {
      assert_eq!(items.len(), 1);
      assert_eq!(items[0].attendance_id, "att-1");
    }
    Err(_) => panic!("expected success"),
  }
}

#[tokio::test]
async fn list_attendance_queue_rejects_invalid_status() {
  let repo = StubAttendanceQueueRepository { result: Ok(vec![]) };
  let use_case = ListAttendanceQueueUseCase::new(Arc::new(repo));

  let result = use_case
    .execute(AttendanceQueueQueryInput {
      date: None,
      status: Some("done".to_string()),
      query: None,
    })
    .await;

  assert!(matches!(result, Err(AppError::Validation(msg)) if msg == "status must be waiting or completed"));
}

#[tokio::test]
async fn list_attendance_queue_maps_repository_error() {
  let repo = StubAttendanceQueueRepository {
    result: Err(PatientRepositoryError::PersistenceError),
  };
  let use_case = ListAttendanceQueueUseCase::new(Arc::new(repo));

  let result = use_case
    .execute(AttendanceQueueQueryInput {
      date: None,
      status: None,
      query: None,
    })
    .await;

  assert!(matches!(result, Err(AppError::Database(msg)) if msg == "failed to fetch attendance queue"));
}
