use tauri::State;

use crate::{
  app::state::AppState,
  domain::patients::dto::{CreatePatientInput, PatientView},
};

#[tauri::command]
pub async fn create_patient(
  state: State<'_, AppState>,
  input: CreatePatientInput,
) -> Result<PatientView, String> {
  state
    .create_patient_use_case
    .execute(input)
    .await
    .map_err(|e| format!("{e:?}"))
}

#[tauri::command]
pub async fn list_patients(
  state: State<'_, AppState>,
  query: Option<String>,
) -> Result<Vec<PatientView>, String> {
  state
    .list_patients_use_case
    .execute(query)
    .await
    .map_err(|e| format!("{e:?}"))
}
