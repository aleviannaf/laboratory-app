use tauri::State;

use crate::{
  app::state::AppState,
  domain::patients::dto::{
    AttendanceQueueItemView, AttendanceQueueQueryInput, CompleteAttendanceInput,
    CreateAttendanceInput, ExamCatalogItemView, PatientRecordEntryView, PatientRecordView,
  },
};

#[tauri::command]
pub async fn get_patient_record(
  state: State<'_, AppState>,
  patient_id: String,
) -> Result<PatientRecordView, String> {
  state
    .get_patient_record_use_case
    .execute(patient_id)
    .await
    .map_err(|e| format!("{e:?}"))
}

#[tauri::command]
pub async fn list_exam_catalog(
  state: State<'_, AppState>,
) -> Result<Vec<ExamCatalogItemView>, String> {
  state
    .list_exam_catalog_use_case
    .execute()
    .await
    .map_err(|e| format!("{e:?}"))
}

#[tauri::command]
pub async fn create_attendance(
  state: State<'_, AppState>,
  input: CreateAttendanceInput,
) -> Result<PatientRecordEntryView, String> {
  state
    .create_attendance_use_case
    .execute(input)
    .await
    .map_err(|e| format!("{e:?}"))
}

#[tauri::command]
pub async fn list_attendance_queue(
  state: State<'_, AppState>,
  date: Option<String>,
  status: Option<String>,
  query: Option<String>,
) -> Result<Vec<AttendanceQueueItemView>, String> {
  state
    .list_attendance_queue_use_case
    .execute(AttendanceQueueQueryInput {
      date,
      status,
      query,
    })
    .await
    .map_err(|e| format!("{e:?}"))
}

#[tauri::command]
pub async fn complete_attendance(
  state: State<'_, AppState>,
  input: CompleteAttendanceInput,
) -> Result<AttendanceQueueItemView, String> {
  state
    .complete_attendance_use_case
    .execute(input)
    .await
    .map_err(|e| format!("{e:?}"))
}
