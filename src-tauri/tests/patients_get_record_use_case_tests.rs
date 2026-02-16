use std::sync::Arc;

use laboratory_app_lib::{
  app::error::AppError,
  application::patients::get_patient_record::GetPatientRecordUseCase,
  domain::patients::{
    dto::{CreateAttendanceInput, ExamCatalogItemView, PatientRecordEntryView, PatientRecordView, PatientView},
    entity::Patient,
    errors::PatientRepositoryError,
    ports::PatientRepository,
  },
};

struct StubGetRecordRepository {
  result: Result<PatientRecordView, PatientRepositoryError>,
}

#[async_trait::async_trait]
impl PatientRepository for StubGetRecordRepository {
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
  ) -> Result<PatientRecordView, PatientRepositoryError> {
    self.result.clone()
  }

  async fn list_exam_catalog(&self) -> Result<Vec<ExamCatalogItemView>, PatientRepositoryError> {
    unimplemented!()
  }

  async fn create_attendance(
    &self,
    _input: CreateAttendanceInput,
  ) -> Result<PatientRecordEntryView, PatientRepositoryError> {
    unimplemented!()
  }
}

#[tokio::test]
async fn get_record_requires_patient_id() {
  let repo = StubGetRecordRepository {
    result: Ok(sample_record()),
  };
  let use_case = GetPatientRecordUseCase::new(Arc::new(repo));

  let result = use_case.execute("   ".to_string()).await;

  assert!(matches!(result, Err(AppError::Validation(msg)) if msg == "patient_id is required"));
}

#[tokio::test]
async fn get_record_returns_record_on_success() {
  let repo = StubGetRecordRepository {
    result: Ok(sample_record()),
  };
  let use_case = GetPatientRecordUseCase::new(Arc::new(repo));

  let result = use_case.execute("pt-1".to_string()).await;

  match result {
    Ok(record) => {
      assert_eq!(record.patient.id, "pt-1");
      assert_eq!(record.entries.len(), 1);
    }
    Err(_) => panic!("expected success"),
  }
}

#[tokio::test]
async fn get_record_maps_repository_not_found_error() {
  let repo = StubGetRecordRepository {
    result: Err(PatientRepositoryError::NotFound),
  };
  let use_case = GetPatientRecordUseCase::new(Arc::new(repo));

  let result = use_case.execute("pt-1".to_string()).await;

  assert!(matches!(result, Err(AppError::Database(msg)) if msg == "patient not found"));
}

fn sample_record() -> PatientRecordView {
  PatientRecordView {
    patient: PatientView {
      id: "pt-1".to_string(),
      full_name: "Maria Souza".to_string(),
      cpf: "12345678900".to_string(),
      birth_date: "1991-10-01".to_string(),
      sex: "F".to_string(),
      phone: "11999999999".to_string(),
      address: "Rua A".to_string(),
      created_at: "2026-01-01T00:00:00".to_string(),
      updated_at: "2026-01-01T00:00:00".to_string(),
    },
    entries: vec![PatientRecordEntryView {
      exam_id: "ex-1".to_string(),
      exam_date: "2026-02-01T09:00:00".to_string(),
      status: "waiting".to_string(),
      requester_name: None,
      items: vec![],
    }],
  }
}
