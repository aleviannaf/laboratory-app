use std::sync::Arc;

use crate::application::patients::{
  complete_attendance::CompleteAttendanceUseCase, create_attendance::CreateAttendanceUseCase,
  create_patient::CreatePatientUseCase, get_patient_record::GetPatientRecordUseCase,
  list_attendance_queue::ListAttendanceQueueUseCase, list_exam_catalog::ListExamCatalogUseCase,
  list_patients::ListPatientsUseCase,
};

#[derive(Clone)]
pub struct AppState {
  pub create_patient_use_case: Arc<CreatePatientUseCase>,
  pub list_patients_use_case: Arc<ListPatientsUseCase>,
  pub get_patient_record_use_case: Arc<GetPatientRecordUseCase>,
  pub list_exam_catalog_use_case: Arc<ListExamCatalogUseCase>,
  pub create_attendance_use_case: Arc<CreateAttendanceUseCase>,
  pub list_attendance_queue_use_case: Arc<ListAttendanceQueueUseCase>,
  pub complete_attendance_use_case: Arc<CompleteAttendanceUseCase>,
}
