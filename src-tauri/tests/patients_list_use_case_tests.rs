use std::sync::Arc;

use laboratory_app_lib::{
  app::error::AppError,
  application::patients::list_patients::ListPatientsUseCase,
  domain::patients::{entity::Patient, errors::PatientRepositoryError, ports::PatientRepository},
};

struct StubListRepository {
  data: Vec<Patient>,
}

#[async_trait::async_trait]
impl PatientRepository for StubListRepository {
  async fn insert(
    &self,
    _input: laboratory_app_lib::domain::patients::dto::CreatePatientInput,
  ) -> Result<Patient, PatientRepositoryError> {
    Err(PatientRepositoryError::PersistenceError)
  }

  async fn list(&self, query: Option<String>) -> Result<Vec<Patient>, PatientRepositoryError> {
    let q = query.unwrap_or_default().to_lowercase();
    if q.trim().is_empty() {
      return Ok(self.data.clone());
    }

    Ok(self
      .data
      .iter()
      .filter(|p| p.full_name.to_lowercase().contains(&q) || p.cpf.contains(&q))
      .cloned()
      .collect())
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
    _input: laboratory_app_lib::domain::patients::dto::AttendanceQueueQueryInput,
  ) -> Result<
    Vec<laboratory_app_lib::domain::patients::dto::AttendanceQueueItemView>,
    PatientRepositoryError,
  > {
    unimplemented!()
  }

  async fn complete_attendance(
    &self,
    _input: laboratory_app_lib::domain::patients::dto::CompleteAttendanceInput,
  ) -> Result<
    laboratory_app_lib::domain::patients::dto::AttendanceQueueItemView,
    PatientRepositoryError,
  > {
    unimplemented!()
  }
}

fn mk_patient(id: &str, full_name: &str, cpf: &str) -> Patient {
  Patient {
    id: id.to_string(),
    full_name: full_name.to_string(),
    cpf: cpf.to_string(),
    birth_date: "1990-01-01T00:00:00".to_string(),
    sex: "F".to_string(),
    phone: "11999999999".to_string(),
    address: "Rua A, 1".to_string(),
    created_at: "2026-01-01T00:00:00".to_string(),
    updated_at: "2026-01-01T00:00:00".to_string(),
  }
}

#[tokio::test]
async fn list_patients_returns_all_when_query_is_none() {
  let repo = StubListRepository {
    data: vec![
      mk_patient("1", "Maria Silva", "11111111111"),
      mk_patient("2", "Joao Souza", "22222222222"),
    ],
  };
  let use_case = ListPatientsUseCase::new(Arc::new(repo));

  let result = use_case.execute(None).await;

  match result {
    Ok(items) => {
      assert_eq!(items.len(), 2);
      assert_eq!(items[0].cpf, "11111111111");
      assert_eq!(items[1].cpf, "22222222222");
    }
    Err(_) => panic!("expected success"),
  }
}

#[tokio::test]
async fn list_patients_filters_by_name_or_cpf() {
  let repo = StubListRepository {
    data: vec![
      mk_patient("1", "Maria Silva", "11111111111"),
      mk_patient("2", "Joao Souza", "22222222222"),
    ],
  };
  let use_case = ListPatientsUseCase::new(Arc::new(repo));

  let by_name = use_case.execute(Some("maria".to_string())).await;
  let by_cpf = use_case.execute(Some("2222".to_string())).await;

  match by_name {
    Ok(items) => assert_eq!(items.len(), 1),
    Err(_) => panic!("expected success"),
  }
  match by_cpf {
    Ok(items) => assert_eq!(items.len(), 1),
    Err(_) => panic!("expected success"),
  }
}

#[tokio::test]
async fn list_patients_maps_repository_error() {
  struct ErrRepo;

  #[async_trait::async_trait]
  impl PatientRepository for ErrRepo {
    async fn insert(
      &self,
      _input: laboratory_app_lib::domain::patients::dto::CreatePatientInput,
    ) -> Result<Patient, PatientRepositoryError> {
      Err(PatientRepositoryError::PersistenceError)
    }

    async fn list(&self, _query: Option<String>) -> Result<Vec<Patient>, PatientRepositoryError> {
      Err(PatientRepositoryError::PersistenceError)
    }

    async fn get_patient_record(
      &self,
      _patient_id: String,
    ) -> Result<
      laboratory_app_lib::domain::patients::dto::PatientRecordView,
      PatientRepositoryError,
    > {
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
      _input: laboratory_app_lib::domain::patients::dto::AttendanceQueueQueryInput,
    ) -> Result<
      Vec<laboratory_app_lib::domain::patients::dto::AttendanceQueueItemView>,
      PatientRepositoryError,
    > {
      unimplemented!()
    }

    async fn complete_attendance(
      &self,
      _input: laboratory_app_lib::domain::patients::dto::CompleteAttendanceInput,
    ) -> Result<
      laboratory_app_lib::domain::patients::dto::AttendanceQueueItemView,
      PatientRepositoryError,
    > {
      unimplemented!()
    }
  }

  let use_case = ListPatientsUseCase::new(Arc::new(ErrRepo));
  let result = use_case.execute(None).await;

  assert!(matches!(result, Err(AppError::Database(msg)) if msg == "failed to fetch patients"));
}
